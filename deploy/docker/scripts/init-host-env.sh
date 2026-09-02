#!/usr/bin/env bash
# Generate /srv/{mysql,redis,dnd-tools}/.env and /srv/mysql/gr.cnf on one dock.
# Shared secrets must already exist in /srv/mysql/shared.env (created once).

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

HOST="$(hostname -s)"
IP="$(host_ip "${HOST}")"
SERVER_ID="$(host_server_id "${HOST}")"
TEMPLATE="${DEPLOY_ROOT}/mysql/gr.cnf.template"
SHARED="/srv/mysql/shared.env"

if [[ ! -f "${SHARED}" ]]; then
    echo "Missing ${SHARED}. Create it once (see init-shared-secrets.sh)." >&2
    exit 1
fi

# shellcheck disable=SC1090
source "${SHARED}"
MYSQL_NETDATA_PASSWORD="${MYSQL_NETDATA_PASSWORD:-}"

sudo tee /srv/mysql/.env >/dev/null <<EOF
HOST_IP=${IP}
MYSQL_SERVER_ID=${SERVER_ID}
MYSQL_GROUP_NAME=${MYSQL_GROUP_NAME}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_REPL_PASSWORD=${MYSQL_REPL_PASSWORD}
MYSQL_APP_USER=${MYSQL_APP_USER}
MYSQL_APP_PASSWORD=${MYSQL_APP_PASSWORD}
MYSQL_DATABASE=${MYSQL_DATABASE}
MYSQL_NETDATA_PASSWORD=${MYSQL_NETDATA_PASSWORD}
EOF
sudo chmod 0640 /srv/mysql/.env
sudo chown root:mysql /srv/mysql/.env

export HOST_IP="${IP}" MYSQL_SERVER_ID="${SERVER_ID}" MYSQL_GROUP_NAME="${MYSQL_GROUP_NAME}"
envsubst < "${TEMPLATE}" | sudo tee /srv/mysql/gr.cnf >/dev/null
sudo chmod 0644 /srv/mysql/gr.cnf
sudo chown root:mysql /srv/mysql/gr.cnf

sudo tee /srv/redis/.env >/dev/null <<EOF
HOST_IP=${IP}
REDIS_PASSWORD=${REDIS_PASSWORD}
EOF
sudo chmod 0640 /srv/redis/.env
sudo chown root:redis /srv/redis/.env

sudo tee /srv/dnd-tools/.env >/dev/null <<EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=${JWT_SECRET}
DATABASE_URL=mysql://${MYSQL_APP_USER}:${MYSQL_APP_PASSWORD}@127.0.0.1:6446/${MYSQL_DATABASE}
CORS_ORIGIN=http://dndtools.local.cyberdeck.org
REDIS_CLUSTER_MODE=true
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_CLUSTER_NODES=192.168.0.89:6379,192.168.0.89:6380,192.168.0.90:6379,192.168.0.90:6380,192.168.0.93:6379,192.168.0.93:6380
DND_REGISTRY=192.168.0.83:5000
APP_TAG=local
EOF
sudo chmod 0640 /srv/dnd-tools/.env
sudo chown root:dnd-tools /srv/dnd-tools/.env

echo "Wrote host env for ${HOST} (${IP})"
