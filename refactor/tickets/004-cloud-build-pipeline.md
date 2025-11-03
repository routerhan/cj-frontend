# Simplify Cloud Build Pipeline

## 1. Summary
- Add a `cloud/cloudbuild.yaml` that builds and pushes the unified Docker image in a single Cloud Build step.

## 2. Why
- After consolidating into one container, the CI pipeline must also build only one image to reduce complexity and avoid outdated frontend/backend build configs.

## 3. Scope
- Create a Cloud Build configuration that uses the new root `Dockerfile`.
- Parameterize the image name (e.g., `_SERVICE_IMAGE`) so the pipeline can be reused across environments.
- Ensure the build step pushes the image to Artifact Registry.

## 4. Out-of-Scope
- Deploying to Cloud Run (covered in a separate operational step).
- Adding automated tests or linting stages (can be layered later).
- Removing any legacy Cloud Build files (none exist today).

## 5. Acceptance Criteria
- `cloud/cloudbuild.yaml` exists and contains a single `docker build` and `docker push` step targeting the unified `Dockerfile`.
- Running `gcloud builds submit --config cloud/cloudbuild.yaml --substitutions=_SERVICE_IMAGE=REGION-docker.pkg.dev/PROJECT/REPO/IMAGE:TAG` kicks off a successful build.

## 6. Implementation Steps
- Create the `cloud` directory if missing.
- Define a Cloud Build config with a `_SERVICE_IMAGE` substitution and steps:
  - `docker build -t $IMAGE_NAME -f Dockerfile .`
  - `docker push $IMAGE_NAME`
- Add the target image to the `images:` section so Cloud Build tracks the artifact.

## 7. Test/Validation
- `gcloud builds submit --config cloud/cloudbuild.yaml --substitutions=_SERVICE_IMAGE=gcr.io/example/project/cj-app:local --no-source` (dry-run) or run against a test project.
- Confirm the build uses the new unified Dockerfile by inspecting the build logs.

## 8. git commit message
- Add single-image Cloud Build config

