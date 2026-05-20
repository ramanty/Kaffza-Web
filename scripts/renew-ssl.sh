#!/usr/bin/env bash
# SSL Auto-Renewal Script for Kaffza
# This script should be run via cron (e.g., daily)
# 0 0 * * * /path/to/kaffza/scripts/renew-ssl.sh

set -e

# Path to the Nginx configuration or docker-compose
APP_DIR="/var/www/kaffza"

# If using standalone certbot
if command -v certbot >/dev/null 2>&1; then
  echo "[$(date)] Starting SSL renewal check..."
  certbot renew --quiet --no-self-upgrade
  
  # Reload Nginx to pick up new certificates if they were renewed
  if systemctl is-active --quiet nginx; then
    systemctl reload nginx
    echo "[$(date)] Nginx reloaded."
  fi
  
  # If using docker-compose for nginx:
  # cd $APP_DIR && docker-compose exec nginx nginx -s reload
  
  echo "[$(date)] SSL renewal check finished."
else
  echo "[$(date)] ERROR: certbot is not installed."
  exit 1
fi
