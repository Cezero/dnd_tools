#!/usr/bin/env bash
# Create /srv/mysql/shared.env once (on any dock; NFS is not used for /srv).
# Copy the same file to the other two docks.

set -euo pipefail

DEST="${1:-/srv/mysql/shared.env}"

if [[ -f "${DEST}" ]]; then
    echo "${DEST} already exists; not overwriting."
    exit 0
fi

rand() {
    openssl rand -base64 24 | tr -d '/+=' | head -c 32
}

sudo tee "${DEST}" >/dev/null <<EOF
MYSQL_GROUP_NAME=$(cat /proc/sys/kernel/random/uuid)
MYSQL_ROOT_PASSWORD=$(rand)
MYSQL_REPL_PASSWORD=$(rand)
MYSQL_APP_USER=dndtools
MYSQL_APP_PASSWORD=$(rand)
MYSQL_DATABASE=cyberdnd
REDIS_PASSWORD=$(rand)
JWT_SECRET=$(rand)
EOF
sudo chmod 0640 "${DEST}"
sudo chown root:mysql "${DEST}"
echo "Wrote ${DEST}. Copy this file to /srv/mysql/shared.env on the other docks before init-host-env.sh."
