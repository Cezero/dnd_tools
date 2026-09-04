#!/usr/bin/env bash
# Restore a dump onto the current Group Replication primary and apply Prisma migrations.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

DUMP="${1:-/home/countzero/git/dnd_tools/apps/backend/backup/cyberdnd_bkp_01192026.sql}"

if [[ ! -f "${DUMP}" ]]; then
    echo "Dump not found: ${DUMP}" >&2
    exit 1
fi

echo "Restoring ${DUMP} on cyberdock01 (bootstrap primary)"
remote cyberdock01 'sudo bash -c "set -a; source /srv/mysql/.env; set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"CREATE DATABASE IF NOT EXISTS \\\`\$MYSQL_DATABASE\\\`;\""'
remote cyberdock01 "sudo bash -c 'set -a; source /srv/mysql/.env; set +a
docker exec -i mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 \"\$MYSQL_DATABASE\"' < '${DUMP}'"

echo "Ensuring app user exists"
remote cyberdock01 'sudo bash -c "set -a; source /srv/mysql/.env; set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"
CREATE DATABASE IF NOT EXISTS \\\`\$MYSQL_DATABASE\\\`;
CREATE USER IF NOT EXISTS '\''\$MYSQL_APP_USER'\''@'\''%'\'' IDENTIFIED WITH mysql_native_password BY '\''\$MYSQL_APP_PASSWORD'\'';
ALTER USER '\''\$MYSQL_APP_USER'\''@'\''%'\'' IDENTIFIED WITH mysql_native_password BY '\''\$MYSQL_APP_PASSWORD'\'';
GRANT ALL ON \\\`\$MYSQL_DATABASE\\\`.* TO '\''\$MYSQL_APP_USER'\''@'\''%'\'';
GRANT ALL ON \\\`prisma_migrate_shadow_db_%\\\`.* TO '\''\$MYSQL_APP_USER'\''@'\''%'\'';
CREATE USER IF NOT EXISTS '\''root'\''@'\''%'\'' IDENTIFIED WITH mysql_native_password BY '\''\$MYSQL_ROOT_PASSWORD'\'';
ALTER USER '\''root'\''@'\''%'\'' IDENTIFIED WITH mysql_native_password BY '\''\$MYSQL_ROOT_PASSWORD'\'';
GRANT ALL ON *.* TO '\''root'\''@'\''%'\'' WITH GRANT OPTION;
FLUSH PRIVILEGES;\""'

echo "Marking dump baseline applied, then prisma migrate deploy (merge + incrementals)"
# shellcheck disable=SC1091
eval "$(ssh -o BatchMode=yes cyberdock01 'sudo bash -c "set -a; source /srv/mysql/.env; set +a; printf \"export DATABASE_URL=mysql://%s:%s@192.168.0.89:3306/%s\\n\" \"\$MYSQL_APP_USER\" \"\$MYSQL_APP_PASSWORD\" \"\$MYSQL_DATABASE\""')"
cd "${REPO_ROOT}/apps/backend"
pnpm exec prisma migrate resolve --applied 20251217000000_baseline_jan2026_dump
pnpm exec prisma migrate deploy

echo "Restore complete. Verify group members still ONLINE."
remote cyberdock01 'sudo bash -c "set -a; source /srv/mysql/.env; set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"SELECT MEMBER_HOST, MEMBER_STATE, MEMBER_ROLE FROM performance_schema.replication_group_members;\""'
