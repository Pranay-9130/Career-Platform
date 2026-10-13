"""Read-only public deployment checks. No credentials or accounts are created.

py scripts/check_deployment.py --frontend https://SITE --backend https://API
Finish with the browser checklist in docs/release-checks.md for Google and cookies.
"""
import argparse
import asyncio
import httpx


async def run(frontend, backend):
    frontend = frontend.rstrip('/')
    backend = backend.rstrip('/')
    async with httpx.AsyncClient(timeout=30) as client:
        for origin in (backend, frontend):
            response = await client.get(f'{origin}/api/health')
            response.raise_for_status()
            if response.json().get('status') != 'healthy':
                raise RuntimeError('API health or same-origin proxy is not healthy.')
        preflight = await client.options(f'{backend}/api/auth/login', headers={
            'Origin': frontend, 'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
        })
        preflight.raise_for_status()
        if preflight.headers.get('access-control-allow-origin') != frontend:
            raise RuntimeError('Frontend origin is not allowed by the backend.')
        print('Backend health, frontend API proxy, and CORS checks passed.')
        print('Complete real Google sign-in and cookie/session checks in docs/release-checks.md.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--frontend', required=True)
    parser.add_argument('--backend', required=True)
    args = parser.parse_args()
    asyncio.run(run(args.frontend, args.backend))
