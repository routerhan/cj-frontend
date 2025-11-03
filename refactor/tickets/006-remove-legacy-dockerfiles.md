# Remove Legacy Dockerfiles

## 1. Summary
- Delete `Dockerfile.frontend` and `backend/Dockerfile`, and clean up any references to them in tooling or documentation.

## 2. Why
- Keeping obsolete Dockerfiles invites accidental use and contradicts the goal of deploying a single container.

## 3. Scope
- Remove the legacy Dockerfiles from the repository.
- Update scripts or docs that still point to the old file paths so they reference the new unified `Dockerfile`.
- Verify no CI or helper script relies on the removed files.

## 4. Out-of-Scope
- Creating the new unified Dockerfile (handled separately).
- Modifying Cloud Build or deployment logic beyond updating referenced file paths.
- Rewriting historical documentation that intentionally describes the previous state for context.

## 5. Acceptance Criteria
- `Dockerfile.frontend` and `backend/Dockerfile` are absent from the repo.
- Search results (`rg 'Dockerfile.frontend'` and `rg 'backend/Dockerfile'`) show only historical context references, not build instructions.
- Build scripts, docs, and helper commands point to the new root `Dockerfile`.

## 6. Implementation Steps
- Delete the legacy Dockerfiles.
- Audit package scripts, docs, and infra configs for references to the old paths and update them to use the unified Dockerfile.
- Run `rg 'Dockerfile.frontend'` and `rg 'backend/Dockerfile'` to confirm only contextual mentions remain.

## 7. Test/Validation
- Attempt to run any documented build command (e.g., `docker build -t cj-app .`) to ensure no script still expects the old files.
- Optional: run `npm run lint` or other automated checks to confirm no tooling references the deleted files.

## 8. git commit message
- Remove legacy split Dockerfiles

