from pathlib import Path
from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles


class FrontendFiles(StaticFiles):
    """Serve frontend assets and SPA routes without masking unknown API routes."""

    async def get_response(self, path, scope):
        route_path = path.replace('\\', '/').lstrip('/')
        if route_path == 'api' or route_path.startswith('api/'):
            raise HTTPException(status_code=404)
        try:
            response = await super().get_response(path, scope)
            if response.status_code != 404:
                return response
        except HTTPException as error:
            if error.status_code != 404:
                raise
        if Path(path).suffix:
            raise HTTPException(status_code=404)
        response = await super().get_response('index.html', scope)
        response.headers['Cache-Control'] = 'no-store'
        return response
