# Serve React Build Through FastAPI

## 1. Summary
- Update `backend/app/main.py` so the FastAPI app serves the built React assets, including SPA fallback routing.

## 2. Why
- Hosting the frontend from the backend container removes the need for a separate static service and fulfills the single-service deployment plan.

## 3. Scope
- Detect the `backend/app/frontend/` directory at runtime and mount it via `StaticFiles`.
- Expose `/` to return `index.html` and add a `/{full_path:path}` fallback that serves files when they exist or falls back to `index.html`.
- Keep existing API routers mounted under `/api`.

## 4. Out-of-Scope
- Creating or copying the React build artifacts (handled by the Dockerfile ticket).
- Adjusting authentication, database logic, or frontend routing code.
- Modifying deployment scripts or environment variables beyond what is needed for static serving.

## 5. Acceptance Criteria
- After running `npm run build` and copying the output into `backend/app/frontend/`, hitting `GET /` via `uvicorn backend.app.main:app` returns the React `index.html`.
- Visiting any non-API route such as `/some/new/path` returns the SPA shell instead of a 404.
- Existing `/api/*` endpoints continue to respond without change.

## 6. Implementation Steps
- Import `Path`, `StaticFiles`, and `FileResponse` in `backend/app/main.py`.
- Define a `FRONTEND_DIST` path pointing to `Path(__file__).parent / "frontend"`.
- When the directory exists, mount static assets (e.g., `/assets`) and add handlers for `/` and `/{full_path:path}` that return `index.html` when the requested file is absent.
- Ensure the new routes are excluded from the OpenAPI schema (`include_in_schema=False`).

## 7. Test/Validation
- `npm run build`
- `cp -R dist/ backend/app/frontend/`
- `uvicorn backend.app.main:app --reload` and verify:
  - `curl -I http://127.0.0.1:8000/` returns `200 OK`.
  - Navigating to `http://127.0.0.1:8000/assets/*` serves static files.
  - `curl -I http://127.0.0.1:8000/api/risk-assessment` still returns API metadata (405 for GET).

## 8. git commit message
- Serve React build via FastAPI

