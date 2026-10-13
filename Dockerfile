FROM node:24-bookworm-slim AS frontend-build
ARG NPM_VERSION=10.9.4
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --global npm@${NPM_VERSION} --no-audit --no-fund
# Normalize optional/native dependency metadata on Linux before the strict install.
# npm install respects already locked versions; this does not discard the lockfile.
RUN npm install --package-lock-only --ignore-scripts --include=dev --include=optional --no-audit --no-fund \
    && (npm ci --include=dev --include=optional --no-audit --no-fund > /tmp/npm-ci.log 2>&1 \
        || (cat /tmp/npm-ci.log; \
            echo '--- npm install failure summary ---'; \
            grep -E 'EUSAGE|Missing:|Invalid:|npm error code|only install|package.json|lock file|npm error path' /tmp/npm-ci.log | tail -n 20; \
            exit 1))
COPY frontend/ ./
ENV VITE_API_BASE_URL=/api
RUN npm run build

FROM python:3.11-slim AS application
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8000 FRONTEND_DIST_DIR=/app/frontend-dist
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend-build /frontend/dist /app/frontend-dist
RUN useradd --create-home --uid 1000 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.getenv('PORT', '8000') + '/api/health/ready', timeout=8)"
CMD ["python", "scripts/start_server.py"]
