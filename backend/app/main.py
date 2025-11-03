"""FastAPI application entry point."""

import logging
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import api_router

BACKEND_APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BACKEND_APP_DIR.parent
REPO_ROOT = BACKEND_DIR.parent


def _resolve_frontend_dist() -> Path | None:
    """Return the first existing frontend build directory."""

    candidates = [
        BACKEND_APP_DIR / "frontend",  # Docker/runtime location
        REPO_ROOT / "dist",  # Local build output when running uvicorn directly
    ]
    for candidate in candidates:
        if (candidate / "index.html").is_file():
            return candidate
    return None


FRONTEND_DIST = _resolve_frontend_dist()
LOGGER = logging.getLogger(__name__)


if __name__ == "backend.app.main":
    sys.modules.setdefault("app.main", sys.modules[__name__])
elif __name__ == "app.main":
    sys.modules.setdefault("backend.app.main", sys.modules[__name__])


def create_app() -> FastAPI:
    """建立 FastAPI 應用，並掛載主要路由。"""

    app = FastAPI(title="Cardiovascular Risk Assessment API", version="0.1.0")
    app.include_router(api_router)

    if FRONTEND_DIST is not None:
        assets_dir = FRONTEND_DIST / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/", include_in_schema=False)
        async def serve_index() -> FileResponse:
            return FileResponse(FRONTEND_DIST / "index.html")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str) -> FileResponse:
            target = FRONTEND_DIST / full_path
            if target.is_file():
                return FileResponse(target)
            return FileResponse(FRONTEND_DIST / "index.html")
    else:
        LOGGER.warning(
            "Frontend build directory not found; SPA responses will return 404."
        )

    return app


app = create_app()
