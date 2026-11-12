"""
AspirePath – Concurrency & Endpoint Benchmark
=============================================
Simulates gradual concurrent user traffic against a staging or local FastAPI
application (or in-process ASGI transport when BENCH_BASE_URL is unset).

Features:
- Gradual ramp-up across configurable concurrency stages (10, 25, 50, 75, 100).
- Configurable per-stage test duration (--duration) and ramp-up window (--ramp-up).
- Aggregate metrics: users, total requests, avg, median, p90, p95, RPS, fail%.
- Per-endpoint metrics: request count, avg, p95, fail% (sorted slowest-first).
- Production safety guardrail: refuses non-local URLs unless --allow-remote is passed.
- Saves JSON and CSV reports for before/after comparisons.

Usage (from backend/):
    # Against staging (requires --allow-remote):
    python -u tests/benchmark_concurrency.py --url https://staging-api.example.com/api --allow-remote

    # Against local uvicorn server:
    python -u tests/benchmark_concurrency.py --url http://127.0.0.1:8000/api
"""

import argparse
import asyncio
import csv
import json
import os
import statistics
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

try:
    import httpx
except ImportError:
    print("httpx is required. Install with: pip install httpx", file=sys.stderr)
    sys.exit(1)

DEFAULT_STAGES = [10, 25, 50, 75, 100]
DEFAULT_ENDPOINTS = [
    "/jobs?page=1&limit=12",
    "/jobs/facets",
    "/projects?page=1&limit=12",
    "/resumes/templates",
    "/health/ready",
]


def is_local_url(url: str) -> bool:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    return host in {"localhost", "127.0.0.1", "testserver", "::1", ""}


def percentile(sorted_values: list[float], pct: float) -> float:
    if not sorted_values:
        return 0.0
    idx = min(int(len(sorted_values) * pct), len(sorted_values) - 1)
    return sorted_values[idx]


async def hit_endpoint(client: httpx.AsyncClient, base_url: str, endpoint: str) -> dict:
    url = f"{base_url.rstrip('/')}{endpoint}"
    start = time.perf_counter()
    try:
        resp = await client.get(url, timeout=15.0)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return {
            "endpoint": endpoint,
            "status": resp.status_code,
            "ms": elapsed_ms,
            "ok": 200 <= resp.status_code < 400,
        }
    except Exception as exc:
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return {
            "endpoint": endpoint,
            "status": 0,
            "ms": elapsed_ms,
            "ok": False,
            "error": str(exc),
        }


async def virtual_user(
    client: httpx.AsyncClient,
    base_url: str,
    user_id: int,
    endpoints: list[str],
    start_delay: float,
    stop_at: float,
) -> list[dict]:
    if start_delay > 0:
        await asyncio.sleep(start_delay)

    results = []
    idx = user_id % len(endpoints)
    while True:
        results.append(await hit_endpoint(client, base_url, endpoints[idx]))
        idx = (idx + 1) % len(endpoints)
        if time.perf_counter() >= stop_at:
            break
        await asyncio.sleep(0.05)  # brief think-time to avoid tight-loop starvation
    return results


def summarize_results(concurrency: int, wall_s: float, flat: list[dict]) -> dict:
    latencies = sorted(r["ms"] for r in flat)
    failures = [r for r in flat if not r["ok"]]
    total_requests = len(flat)
    rps = total_requests / wall_s if wall_s > 0 else 0.0

    by_endpoint: dict[str, list[dict]] = defaultdict(list)
    for row in flat:
        by_endpoint[row["endpoint"]].append(row)

    endpoint_stats = []
    for endpoint, rows in by_endpoint.items():
        ep_lat = sorted(r["ms"] for r in rows)
        ep_fail = sum(1 for r in rows if not r["ok"])
        ep_count = len(rows)
        endpoint_stats.append({
            "endpoint": endpoint,
            "requests": ep_count,
            "avg_ms": round(statistics.mean(ep_lat), 2) if ep_lat else 0.0,
            "p95_ms": round(percentile(ep_lat, 0.95), 2),
            "failure_rate_pct": round((ep_fail / ep_count) * 100.0, 2) if ep_count else 0.0,
        })

    endpoint_stats.sort(key=lambda item: item["p95_ms"], reverse=True)

    return {
        "concurrency": concurrency,
        "total_requests": total_requests,
        "wall_s": round(wall_s, 2),
        "rps": round(rps, 2),
        "avg_ms": round(statistics.mean(latencies), 2) if latencies else 0.0,
        "median_ms": round(statistics.median(latencies), 2) if latencies else 0.0,
        "p90_ms": round(percentile(latencies, 0.90), 2),
        "p95_ms": round(percentile(latencies, 0.95), 2),
        "failures": len(failures),
        "failure_rate_pct": round((len(failures) / total_requests) * 100.0, 2) if total_requests else 0.0,
        "endpoints": endpoint_stats,
    }


async def run_stage(
    concurrency: int,
    base_url: str,
    endpoints: list[str],
    duration_s: float,
    ramp_up_s: float,
    fastapi_app=None,
) -> dict:
    client_kwargs = {"follow_redirects": True}
    if fastapi_app is not None:
        client_kwargs["transport"] = httpx.ASGITransport(app=fastapi_app)

    limits = httpx.Limits(max_connections=max(concurrency + 20, 100), max_keepalive_connections=concurrency)
    if fastapi_app is None:
        client_kwargs["limits"] = limits

    wall_start = time.perf_counter()
    stop_at = wall_start + ramp_up_s + duration_s

    async with httpx.AsyncClient(**client_kwargs) as client:
        tasks = []
        for i in range(concurrency):
            delay = (ramp_up_s * i / max(concurrency - 1, 1)) if concurrency > 1 else 0.0
            tasks.append(virtual_user(client, base_url, i, endpoints, delay, stop_at))
        per_user_results = await asyncio.gather(*tasks)

    wall_elapsed = time.perf_counter() - wall_start
    flat = [item for user_rows in per_user_results for item in user_rows]
    return summarize_results(concurrency, wall_elapsed, flat)


def write_reports(report: dict, json_path: Path, csv_path: Path) -> None:
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow([
            "stage_concurrency",
            "scope",
            "endpoint",
            "requests",
            "rps",
            "avg_ms",
            "median_ms",
            "p90_ms",
            "p95_ms",
            "failure_rate_pct",
        ])
        for stage in report["stages"]:
            writer.writerow([
                stage["concurrency"],
                "aggregate",
                "ALL",
                stage["total_requests"],
                stage["rps"],
                stage["avg_ms"],
                stage["median_ms"],
                stage["p90_ms"],
                stage["p95_ms"],
                stage["failure_rate_pct"],
            ])
            for ep in stage["endpoints"]:
                writer.writerow([
                    stage["concurrency"],
                    "endpoint",
                    ep["endpoint"],
                    ep["requests"],
                    "",
                    ep["avg_ms"],
                    "",
                    "",
                    ep["p95_ms"],
                    ep["failure_rate_pct"],
                ])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="AspirePath concurrency & endpoint benchmark")
    parser.add_argument(
        "--url",
        default=os.getenv("BENCH_BASE_URL", "").strip(),
        help="Target API base URL (e.g. http://127.0.0.1:8000/api). Defaults to in-process ASGI if unset.",
    )
    parser.add_argument(
        "--stages",
        default=",".join(str(s) for s in DEFAULT_STAGES),
        help="Comma-separated virtual user stages (default: 10,25,50,75,100).",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=float(os.getenv("BENCH_DURATION_S", "8")),
        help="Steady-state duration in seconds per stage (default: 8).",
    )
    parser.add_argument(
        "--ramp-up",
        type=float,
        default=float(os.getenv("BENCH_RAMP_UP_S", "2")),
        help="Gradual ramp-up window in seconds per stage (default: 2).",
    )
    parser.add_argument(
        "--allow-remote",
        action="store_true",
        default=os.getenv("BENCH_ALLOW_REMOTE", "").lower() in {"1", "true", "yes"},
        help="Required when targeting a non-local URL to prevent accidental production load.",
    )
    parser.add_argument(
        "--output-json",
        default=str(Path(__file__).resolve().parent / "benchmark_report.json"),
        help="Path to write JSON benchmark report.",
    )
    parser.add_argument(
        "--output-csv",
        default=str(Path(__file__).resolve().parent / "benchmark_report.csv"),
        help="Path to write CSV benchmark report.",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    stages = [int(s.strip()) for s in args.stages.split(",") if s.strip()]

    fastapi_app = None
    if args.url:
        base_url = args.url.rstrip("/")
        if not is_local_url(base_url) and not args.allow_remote:
            print(
                f"SAFETY BLOCK: '{base_url}' is a non-local URL. "
                "Verify it is a staging environment and pass --allow-remote (or BENCH_ALLOW_REMOTE=1).",
                file=sys.stderr,
            )
            sys.exit(2)
    else:
        os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///career_platform.db")
        from app.main import app as fastapi_app
        base_url = "http://testserver/api"

    print(f"\nAspirePath Concurrency Benchmark -> {base_url}", flush=True)
    print(f"Stages: {stages} | Ramp-up: {args.ramp_up}s | Duration: {args.duration}s", flush=True)
    print(f"Endpoints: {DEFAULT_ENDPOINTS}\n", flush=True)
    print(
        f"{'Users':>6} {'Reqs':>7} {'RPS':>8} {'Avg ms':>9} {'Med ms':>9} {'p90 ms':>9} {'p95 ms':>9} {'Fail%':>7}",
        flush=True,
    )
    print("-" * 74, flush=True)

    stage_results = []
    for users in stages:
        res = await run_stage(
            concurrency=users,
            base_url=base_url,
            endpoints=DEFAULT_ENDPOINTS,
            duration_s=args.duration,
            ramp_up_s=args.ramp_up,
            fastapi_app=fastapi_app,
        )
        stage_results.append(res)
        print(
            f"{res['concurrency']:>6} {res['total_requests']:>7} {res['rps']:>8} "
            f"{res['avg_ms']:>9} {res['median_ms']:>9} {res['p90_ms']:>9} {res['p95_ms']:>9} "
            f"{res['failure_rate_pct']:>6}%",
            flush=True,
        )

    peak = stage_results[-1] if stage_results else None
    if peak:
        print(f"\nEndpoint Breakdown at {peak['concurrency']} Concurrent Users (Slowest p95 First):", flush=True)
        print(f"{'Endpoint':<30} {'Reqs':>7} {'Avg ms':>9} {'p95 ms':>9} {'Fail%':>7}", flush=True)
        print("-" * 66, flush=True)
        for ep in peak["endpoints"]:
            print(
                f"{ep['endpoint']:<30} {ep['requests']:>7} {ep['avg_ms']:>9} "
                f"{ep['p95_ms']:>9} {ep['failure_rate_pct']:>6}%",
                flush=True,
            )

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "target_url": base_url,
        "duration_s_per_stage": args.duration,
        "ramp_up_s_per_stage": args.ramp_up,
        "stages": stage_results,
    }
    json_path = Path(args.output_json)
    csv_path = Path(args.output_csv)
    write_reports(report, json_path, csv_path)
    print(f"\nReports saved:\n  JSON: {json_path}\n  CSV:  {csv_path}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
