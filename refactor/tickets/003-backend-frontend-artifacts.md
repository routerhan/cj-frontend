# Prevent Committing Frontend Build Artifacts

## 1. Summary
- Prepare `backend/app/frontend/` as the destination for React build assets and update ignore rules so generated files are not tracked by git.

## 2. Why
- The unified container copies the React build into the backend package; without ignore rules, local builds could pollute commits or cause merge noise.

## 3. Scope
- Add a placeholder (e.g., `.gitkeep` or README) inside `backend/app/frontend/` so the directory exists in source control.
- Update the root `.gitignore` to exclude the contents of `backend/app/frontend/` while keeping the placeholder tracked.

## 4. Out-of-Scope
- Building or copying the React artifacts themselves.
- Adjusting FastAPI routing or Docker build steps.
- Updating documentation or deployment scripts.

## 5. Acceptance Criteria
- `backend/app/frontend/` is present in the repo with only a tracked placeholder file.
- Running `npm run build` followed by copying assets into `backend/app/frontend/` results in no untracked/modified files (`git status` clean).

## 6. Implementation Steps
- Create `backend/app/frontend/` if it does not already exist and add a `.gitkeep` (or similar) file.
- Modify `.gitignore` to ignore everything under `backend/app/frontend/` except the placeholder file.
- Verify the ignore rule works by simulating a copy of the React build output.

## 7. Test/Validation
- `mkdir -p backend/app/frontend && touch backend/app/frontend/.gitkeep`
- `rsync -a dist/ backend/app/frontend/`
- `git status` should report no new files under `backend/app/frontend/`.

## 8. git commit message
- Ignore backend frontend build output

