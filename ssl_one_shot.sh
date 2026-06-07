#!/usr/bin/env bash
set -euo pipefail

# Kaffza SSL One Shot (Let's Encrypt)
# Requirements:
# - DNS must point to this server
# - Nginx container must be running
#
# Usage:
#   DOMAIN=kaffza.me EMAIL=admin@kaffza.me bash ssl_one_shot.sh
#
# Notes:
# - Wildcards (*.domain) require DNS challenge; this script uses HTTP-01.

DOMAIN=${DOMAIN:-""}
EMAIL=${EMAIL:-""}

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "❌ Please provide DOMAIN and EMAIL"
  echo "Example: DOMAIN=kaffza.me EMAIL=admin@kaffza.me bash ssl_one_shot.sh"
  exit 1
fi

mkdir -p nginx/ssl nginx/certbot

echo "✅ Requesting certificate for $DOMAIN ..."

docker compose -f production/docker-compose.yml run --rm   -v "$PWD/nginx/certbot:/var/www/certbot"   -v "$PWD/nginx/ssl:/etc/letsencrypt"   certbot certonly --webroot   -w /var/www/certbot   -d "$DOMAIN"   --email "$EMAIL" --agree-tos --non-interactive

# Copy live certs into nginx/ssl for simpler mounting
LIVE_DIR="nginx/ssl/live/$DOMAIN"
if [[ -d "$LIVE_DIR" ]]; then
  cp "$LIVE_DIR/fullchain.pem" nginx/ssl/fullchain.pem
  cp "$LIVE_DIR/privkey.pem" nginx/ssl/privkey.pem
fi

echo "✅ Reloading nginx..."
docker compose -f production/docker-compose.yml exec nginx nginx -s reload

echo "🎉 Done. HTTPS should be active now."
