#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

echo "Running database migrations..."
while ! alembic upgrade head; do
  echo "Migration failed, retrying in 3 seconds..."
  sleep 3
done

echo "Starting application..."
PORT_TO_USE=${PORT:-8000}
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT_TO_USE}"
