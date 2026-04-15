#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="production/docker-compose.yml"
ENV_FILE=".env.production"
USE_DOCKER_NGINX="${USE_DOCKER_NGINX:-0}"

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker is not installed."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "❌ Docker Compose plugin is not available."
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ $ENV_FILE is missing."
  echo "Create it first: cp .env.production.example .env.production"
  exit 1
fi

mkdir -p nginx/ssl nginx/certbot

echo "🔄 Checking for latest code from origin/main..."
git fetch origin main --quiet
LOCAL_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git rev-parse origin/main)"
if [[ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]]; then
  echo "⬆️  Updating repository to latest origin/main..."
  git pull --rebase --autostash origin main
else
  echo "✅ Repository is already up to date."
fi

echo "🚀 Starting Kaffza production stack..."
if [[ "$USE_DOCKER_NGINX" == "1" ]]; then
  if [[ ! -f nginx/ssl/fullchain.pem || ! -f nginx/ssl/privkey.pem ]]; then
    echo "❌ SSL certificate files are missing in nginx/ssl/"
    echo "Run once to issue certs:"
    echo "DOMAIN=kaffza.me EMAIL=your-email@domain.com bash ssl_one_shot.sh"
    exit 1
  fi
  docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans
  echo "✅ Deployment started with Docker Nginx."
else
  docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans postgres redis minio api web
  if command -v nginx >/dev/null 2>&1; then
    if [[ "${EUID}" -eq 0 ]]; then
      nginx -t
      systemctl reload nginx
    elif command -v sudo >/dev/null 2>&1; then
      sudo nginx -t
      sudo systemctl reload nginx
    else
      echo "⚠️ nginx found, but no sudo/root access to reload it."
    fi
  fi
  echo "✅ Deployment started with host Nginx."
fi

echo "Open: https://kaffza.me"
