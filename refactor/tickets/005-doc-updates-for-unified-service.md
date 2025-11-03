# Refresh Documentation For Unified Service

## 1. Summary
- Update project documentation to describe the single-service architecture, new Dockerfile, and adjusted environment variable requirements.

## 2. Why
- Existing docs still reference separate frontend/backend services, leading to confusion once the codebase and deployment pipeline are unified.

## 3. Scope
- Revise `README.md` sections covering deployment, Docker usage, and environment variables.
- Update `plan.md` or other internal guides that mention the old split container approach.
- Add instructions for building/running the unified container locally and in Cloud Run.

## 4. Out-of-Scope
- Changing actual build scripts or configuration files.
- Writing Cloud Run infrastructure-as-code.
- Translating docs into additional languages.

## 5. Acceptance Criteria
- Documentation references only the new unified `Dockerfile` and removes stale guidance for `Dockerfile.frontend` / `backend/Dockerfile`.
- Environment variable lists no longer mention `VITE_API_BASE_URL` or `BACKEND_URL`.
- Deployment instructions include the new Cloud Build command and single Cloud Run service flow.

## 6. Implementation Steps
- Audit existing docs for outdated references (README, plan, any `docs/` entries).
- Update setup, build, and deployment sections to reflect the consolidated workflow.
- Add a short walkthrough on how to run the unified container locally (build, run, open browser).
- Proofread to ensure terminology (e.g., "single Cloud Run service") is consistent.

## 7. Test/Validation
- Render `README.md` locally (e.g., VS Code preview) to confirm formatting.
- Share the updated instructions with a teammate for smoke testing, or dry-run them yourself to ensure they work.

## 8. git commit message
- Update docs for single-service deployment

