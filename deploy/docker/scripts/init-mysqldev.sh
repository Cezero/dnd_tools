#!/usr/bin/env bash
# Stand up cyberdev01 /srv/mysqldev (non-GR MySQL) and apply Prisma history locally.
# Does not touch cybersql / live cyberdnd.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

BACKEND_ENV="${REPO_ROOT}/apps/backend/.env"
SRV_DIR="/srv/mysqldev"
SRV_ENV="${SRV_DIR}/.env"
COMPOSE="${SRV_DIR}/compose.yml"

rand() {
    openssl rand -base64 24 | tr -d '/+=' | head -c 32
}

urlencode() {
    python3 -c 'import os, urllib.parse; print(urllib.parse.quote(os.environ["Q"], safe=""))' 
}

sudo mkdir -p "${SRV_DIR}/data"
sudo install -m 0644 "${DEPLOY_ROOT}/mysqldev/compose.yml" "${COMPOSE}"

if [[ ! -f "${SRV_ENV}" ]]; then
    sudo tee "${SRV_ENV}" >/dev/null <<EOF
MYSQL_ROOT_PASSWORD=$(rand)
MYSQL_DATABASE=cyberdnd
MYSQL_USER=dndtools
MYSQL_PASSWORD=$(rand)
EOF
    echo "Wrote ${SRV_ENV}"
else
    echo "${SRV_ENV} already exists; not overwriting secrets."
fi

sudo chmod 0640 "${SRV_ENV}"
sudo chown countzero:users "${SRV_ENV}"
# Official image initializes datadir as uid 999.
sudo chown -R 999:999 "${SRV_DIR}/data" || true

# shellcheck disable=SC1090
set -a
source "${SRV_ENV}"
set +a

docker compose -f "${COMPOSE}" up -d

echo "Waiting for mysqldev..."
deadline=$((SECONDS + 180))
until docker exec mysqldev mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" --protocol=TCP -h127.0.0.1 -e "SELECT 1" >/dev/null 2>&1; do
    if (( SECONDS >= deadline )); then
        echo "mysqldev did not become ready" >&2
        docker compose -f "${COMPOSE}" logs --tail 40
        exit 1
    fi
    sleep 2
done

# Privileges for prisma migrate dev shadow DBs (CREATE DATABASE). Local only.
docker exec mysqldev mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" --protocol=TCP -h127.0.0.1 -e "
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PASSWORD}';
ALTER USER '${MYSQL_USER}'@'%' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PASSWORD}';
GRANT ALL ON *.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
"

Q="${MYSQL_PASSWORD}" export Q
encoded="$(urlencode)"
dev_url="mysql://${MYSQL_USER}:${encoded}@127.0.0.1:3307/${MYSQL_DATABASE}"

if [[ -f "${BACKEND_ENV}" ]]; then
    python3 - "${BACKEND_ENV}" "${dev_url}" <<'PY'
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
url = sys.argv[2]
text = path.read_text()
lines = text.splitlines(keepends=True)
out = []
found = False
for line in lines:
    if line.startswith("DATABASE_URL_DEV="):
        out.append(f"DATABASE_URL_DEV=\"{url}\"\n")
        found = True
    else:
        out.append(line)
if not found:
    if out and not out[-1].endswith("\n"):
        out.append("\n")
    out.append("\n# Local mysqldev (cyberdev01 :3307). Used only by prisma-migrate-dev.sh.\n")
    out.append(f"DATABASE_URL_DEV=\"{url}\"\n")
path.write_text("".join(out))
PY
    echo "Updated DATABASE_URL_DEV in apps/backend/.env"
else
    echo "Missing ${BACKEND_ENV}; skip DATABASE_URL_DEV" >&2
fi

echo "Applying Prisma history to local mysqldev (not cybersql)"
cd "${REPO_ROOT}/apps/backend"
DATABASE_URL="${dev_url}" pnpm exec prisma migrate deploy

echo "mysqldev is up on 127.0.0.1:3307 (restart: always)."
echo "Migrate: ${DEPLOY_ROOT}/scripts/prisma-migrate-dev.sh --name <name>"
echo "Promote: ${DEPLOY_ROOT}/scripts/prisma-migrate-deploy.sh"
