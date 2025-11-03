# Combined Dockerfile For Single Service

## 1. Summary
- Create a multi-stage `Dockerfile` at the repo root that builds the React app, installs FastAPI dependencies, and produces a single runtime image that reuses `backend/scripts/start.sh`.

## 2. Why
- We currently maintain separate frontend and backend containers; a single image simplifies deployment and matches the refactor proposal for one Cloud Run service.

## 3. Scope
- Add a root-level `Dockerfile` with Node builder, Python builder, and Python runtime stages.
- Ensure the runtime stage copies the React `dist/` output into `backend/app/frontend/` and bundles required Python packages.
- Keep compatibility with the existing `backend/scripts/start.sh` entrypoint.

## 4. Out-of-Scope
- Removing `Dockerfile.frontend` or `backend/Dockerfile`.
- Updating documentation or CI/CD configs.
- Changing FastAPI static file handling (covered by another ticket).

## 5. Acceptance Criteria
- Running `docker build -t unified-app -f Dockerfile .` in the repo root succeeds without manual context tweaks.
- The final image contains `backend/app/frontend/index.html` generated from the frontend build stage.
- Starting the container with `docker run --rm -e DATABASE_URL=sqlite:///./app.db -e PORT=8080 unified-app` launches Uvicorn listening on port 8080 via `/start.sh`.

## 6. Implementation Steps
- Create the new `Dockerfile` with stages: `frontend_builder` (`node:20-alpine`), `python_builder` (`python:3.11-slim`), and a minimal Python runtime.
- In `frontend_builder`, run `npm ci` then `npm run build` to produce `dist/`.
- In `python_builder`, install build tooling plus `pip install -r backend/requirements.txt`.
- In the runtime stage, copy Python site-packages, backend source, and the `dist/` contents into `backend/app/frontend/`.
- Copy `backend/scripts/start.sh` to `/start.sh`, make it executable, and set it as the container `CMD`.

## 7. Test/Validation
- `docker build -t unified-app .`
- `docker run --rm -e DATABASE_URL=sqlite:///./app.db -e PORT=8080 -p 8080:8080 unified-app` and verify the logs show "Application startup complete".
- `curl -I http://localhost:8080/api/risk-assessment` returns HTTP 405 (method not allowed), confirming the API is reachable.

## 8. git commit message
- Add multi-stage Dockerfile for single service

