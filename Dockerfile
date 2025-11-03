# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.11-slim
ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS frontend_builder
WORKDIR /app

ENV CI=1

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM python:${PYTHON_VERSION} AS python_builder
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/requirements.txt

RUN pip install --no-cache-dir --prefix /install -r backend/requirements.txt

FROM python:${PYTHON_VERSION} AS runtime
WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=python_builder /install /usr/local

COPY backend /app/backend
COPY --from=frontend_builder /app/dist /app/backend/app/frontend

RUN chmod +x scripts/start.sh

EXPOSE 8080

CMD ["scripts/start.sh"]
