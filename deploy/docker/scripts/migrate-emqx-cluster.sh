#!/usr/bin/env bash
# Migrate the existing 2-node EMQX stack to a 3-node static cluster.
# Run on a workstation that can SSH to the docks. Uses sudo docker on each host.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

COMPOSE_FILE="${DEPLOY_ROOT}/emqx/compose.yml"

write_env() {
    local host="$1"
    local ip
    local name
    local password="$2"
    ip="$(host_ip "${host}")"
    name="$(emqx_node_name "${host}")"
    remote "${host}" "sudo tee /srv/emqx/.env >/dev/null <<EOF
HOST_IP=${ip}
EMQX_CONTAINER_NAME=${name}
EMQX_DASHBOARD__DEFAULT_PASSWORD=${password}
EOF
sudo chmod 0640 /srv/emqx/.env
sudo chown root:emqx /srv/emqx/.env"
}

copy_volume_data() {
    local host="$1"
    local container="$2"
    remote "${host}" "set -euo pipefail
if sudo docker inspect ${container} >/dev/null 2>&1; then
  sudo docker cp ${container}:/opt/emqx/data/. /var/lib/emqx/data/
  sudo docker cp ${container}:/opt/emqx/log/. /var/lib/emqx/log/ || true
  sudo chown -R emqx:emqx /var/lib/emqx
fi"
}

stop_old() {
    local host="$1"
    remote "${host}" "sudo docker rm -f emqx_node1 emqx_node2 emqx_node3 2>/dev/null || true
# Drop leftover compose projects that used named volumes
if [[ -f /srv/emqx/docker-compose.yml ]]; then
  sudo docker compose -f /srv/emqx/docker-compose.yml down --remove-orphans 2>/dev/null || true
fi
if [[ -f /srv/eqmx/docker-compose.yml ]]; then
  sudo docker compose -f /srv/eqmx/docker-compose.yml down --remove-orphans 2>/dev/null || true
fi
# dock03 clone must not keep node2 data
if [[ \$(hostname -s) == cyberdock03 ]]; then
  sudo rm -rf /var/lib/emqx/data/* /var/lib/emqx/log/*
  sudo docker volume rm eqmx_emqx1_data eqmx_emqx1_log emqx_emqx1_data emqx_emqx1_log 2>/dev/null || true
fi"
}

start_new() {
    local host="$1"
    remote "${host}" "sudo docker compose --env-file /srv/emqx/.env -f ${COMPOSE_FILE} up -d"
}

echo "Reading existing dashboard password from cyberdock01"
PASSWORD="$(remote cyberdock01 "sudo docker inspect emqx_node1 --format '{{range .Config.Env}}{{println .}}{{end}}'" | awk -F= '/EMQX_DASHBOARD__DEFAULT_PASSWORD=/{print $2}')"
if [[ -z "${PASSWORD}" ]]; then
    echo "Could not read existing EMQX dashboard password" >&2
    exit 1
fi

echo "Copying live data from dock01/02 (preserve cluster identity)"
copy_volume_data cyberdock01 emqx_node1
copy_volume_data cyberdock02 emqx_node2

echo "Writing /srv/emqx/.env on all docks"
for host in "${DOCKS[@]}"; do
    write_env "${host}" "${PASSWORD}"
done

echo "Stopping old EMQX containers"
for host in "${DOCKS[@]}"; do
    stop_old "${host}"
done

echo "Starting 3-node compose"
for host in cyberdock01 cyberdock02 cyberdock03; do
    start_new "${host}"
    sleep 5
done

echo "Waiting for cluster..."
sleep 15
remote cyberdock01 "sudo docker exec emqx_node1 emqx ctl cluster status"
