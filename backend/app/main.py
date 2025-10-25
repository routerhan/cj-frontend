"""FastAPI application entry point."""

from fastapi import FastAPI

from .api import api_router


def create_app() -> FastAPI:
    """建立 FastAPI 應用，並掛載主要路由。"""

    app = FastAPI(title="Cardiovascular Risk Assessment API", version="0.1.0")
    app.include_router(api_router)
    return app


app = create_app()

