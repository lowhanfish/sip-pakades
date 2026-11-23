#!/usr/bin/env bash
set -euo pipefail

# Skrip Backup Database MySQL SIP-PAKADES (dengan retensi 14 hari)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKEND_DIR}/backups"
mkdir -p "${BACKUP_DIR}"

if [ -f "${BACKEND_DIR}/.env" ]; then
  set -a
  source "${BACKEND_DIR}/.env"
  set +a
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-sippakades}"

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
OUT_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  -h "${DB_HOST}" \
  -P "${DB_PORT}" \
  -u "${DB_USER}" \
  ${DB_PASSWORD:+-p"${DB_PASSWORD}"} \
  "${DB_NAME}" | gzip -c > "${OUT_FILE}"

# Hapus arsip lebih lama dari 14 hari
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime +14 -delete

echo "Backup selesai: ${OUT_FILE}"
