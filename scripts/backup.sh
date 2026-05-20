#!/usr/bin/env bash
set -euo pipefail

# H-02: Automate daily database backups
# This script should be run via a cron job on the production server.
# Example cron: 0 2 * * * /path/to/kaffza/scripts/backup.sh >> /var/log/kaffza-backup.log 2>&1

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_DIR="${ROOT_DIR}/backups"
mkdir -p "$BACKUP_DIR"

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/kaffza_db_${DATE}.sql.gz"

echo "[$(date)] Starting Kaffza database backup..."

# Assuming the database container is named "postgres" and the user is "kaffza"
# This requires the container to be running
if ! docker compose -f production/docker-compose.yml exec -T postgres pg_dump -U kaffza kaffza_db | gzip > "$BACKUP_FILE"; then
  echo "[$(date)] ❌ Backup failed!"
  exit 1
fi

echo "[$(date)] ✅ Backup successful: $BACKUP_FILE"

# Keep only the last 7 days of backups
echo "[$(date)] Cleaning up old backups..."
find "$BACKUP_DIR" -type f -name "kaffza_db_*.sql.gz" -mtime +7 -exec rm {} \;

echo "[$(date)] Backup process completed."
