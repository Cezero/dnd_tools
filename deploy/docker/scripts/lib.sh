#!/usr/bin/env bash
# Shared helpers for dock deploy scripts.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEPLOY_ROOT="${REPO_ROOT}/deploy/docker"

SSH_OPTS=(
    -o BatchMode=yes
    -o ConnectTimeout=10
    -o StrictHostKeyChecking=accept-new
)

DOCKS=(cyberdock01 cyberdock02 cyberdock03)

# LAN Docker registry on cyberdev01. HTTP only; docks and this host must list
# it in Docker Engine insecure-registries (see configure-insecure-registry.sh).
DND_REGISTRY="${DND_REGISTRY:-192.168.0.83:5000}"
APP_TAG="${APP_TAG:-local}"

host_ip() {
    local host="${1:-$(hostname -s)}"
    case "${host}" in
        cyberdev01|cyberdev01.local.cyberdeck.org) echo "192.168.0.83" ;;
        cyberdock01|cyberdock01.local.cyberdeck.org) echo "192.168.0.89" ;;
        cyberdock02|cyberdock02.local.cyberdeck.org) echo "192.168.0.90" ;;
        cyberdock03|cyberdock03.local.cyberdeck.org) echo "192.168.0.93" ;;
        *)
            echo "Unknown dock host: ${host}" >&2
            return 1
            ;;
    esac
}

host_server_id() {
    local host="${1:-$(hostname -s)}"
    case "${host}" in
        cyberdock01|cyberdock01.local.cyberdeck.org) echo "1" ;;
        cyberdock02|cyberdock02.local.cyberdeck.org) echo "2" ;;
        cyberdock03|cyberdock03.local.cyberdeck.org) echo "3" ;;
        *)
            echo "Unknown dock host: ${host}" >&2
            return 1
            ;;
    esac
}

emqx_node_name() {
    local host="${1:-$(hostname -s)}"
    case "${host}" in
        cyberdock01|cyberdock01.local.cyberdeck.org) echo "emqx_node1" ;;
        cyberdock02|cyberdock02.local.cyberdeck.org) echo "emqx_node2" ;;
        cyberdock03|cyberdock03.local.cyberdeck.org) echo "emqx_node3" ;;
        *)
            echo "Unknown dock host: ${host}" >&2
            return 1
            ;;
    esac
}

# SSH retries: dock /home is NFS (cybernas01). When the mount or Samba
# auth drops, countzero login fails until NAS recovers.
remote() {
    local host="$1"
    shift
    local attempt=1
    local max=6
    while true; do
        if ssh "${SSH_OPTS[@]}" "${host}" "$@"; then
            return 0
        fi
        if (( attempt >= max )); then
            echo "SSH to ${host} failed after ${max} attempts (NFS /home or Samba auth?)" >&2
            return 1
        fi
        echo "SSH to ${host} failed (attempt ${attempt}/${max}); retrying in 8s" >&2
        sleep 8
        attempt=$((attempt + 1))
    done
}

# Copy compose files onto local /srv so docker compose does not need NFS /home.
install_compose_to_srv() {
    local host="$1"
    remote "${host}" "sudo mkdir -p /srv/mysql /srv/redis /srv/dnd-tools"
    scp "${SSH_OPTS[@]}" \
        "${DEPLOY_ROOT}/mysql-router/compose.yml" \
        "${host}:/tmp/mysql-router-compose.yml"
    scp "${SSH_OPTS[@]}" \
        "${DEPLOY_ROOT}/redis/compose.yml" \
        "${DEPLOY_ROOT}/redis/redis.conf" \
        "${host}:/tmp/"
    scp "${SSH_OPTS[@]}" \
        "${DEPLOY_ROOT}/app/compose.yml" \
        "${host}:/tmp/dnd-tools-compose.yml"
    remote "${host}" "sudo install -m 0644 /tmp/mysql-router-compose.yml /srv/mysql/router-compose.yml
sudo install -m 0644 /tmp/compose.yml /srv/redis/compose.yml
sudo install -m 0644 /tmp/redis.conf /srv/redis/redis.conf
sudo install -m 0644 /tmp/dnd-tools-compose.yml /srv/dnd-tools/compose.yml
rm -f /tmp/mysql-router-compose.yml /tmp/compose.yml /tmp/redis.conf /tmp/dnd-tools-compose.yml"
}

remote_root_lb() {
    ssh "${SSH_OPTS[@]}" root@cyberlb01 "$@"
}

sudo_docker() {
    sudo docker "$@"
}

sudo_compose() {
    sudo docker compose "$@"
}

# After a dock Docker Engine restart, wait until local mysqld is in the group
# as ONLINE. If the group has no ONLINE members yet (first bootstrap), succeed
# once mysqladmin ping works so bring-up is not blocked.
wait_dock_gr_online() {
    local host="$1"
    local timeout_s="${2:-180}"
    echo "Waiting for Group Replication ONLINE on ${host} (timeout ${timeout_s}s)..."
    remote "${host}" "sudo bash -c '
set -euo pipefail
set -a
source /srv/mysql/.env
set +a
deadline=\$((SECONDS+${timeout_s}))
while (( SECONDS < deadline )); do
    if docker exec mysql mysqladmin ping -h127.0.0.1 -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --silent >/dev/null 2>&1; then
        break
    fi
    sleep 3
done
if ! docker exec mysql mysqladmin ping -h127.0.0.1 -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --silent >/dev/null 2>&1; then
    echo \"MySQL did not become ready on ${host}\" >&2
    exit 1
fi
member_sql() {
    docker exec mysql mysql -N -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"\$1\" 2>/dev/null | tail -1
}
online_any=\$(member_sql \"SELECT COUNT(*) FROM performance_schema.replication_group_members WHERE MEMBER_STATE=\\\"ONLINE\\\";\")
if [[ \"\${online_any}\" == \"0\" ]]; then
    echo \"GR not bootstrapped yet on ${host}; mysql is up\"
    exit 0
fi
state=\"NONE\"
while (( SECONDS < deadline )); do
    state=\$(member_sql \"SELECT IFNULL(MAX(MEMBER_STATE), \\\"NONE\\\") FROM performance_schema.replication_group_members WHERE MEMBER_HOST=\\\"\$HOST_IP\\\";\")
    if [[ \"\$state\" == \"ONLINE\" ]]; then
        echo \"${host} GR member ONLINE\"
        exit 0
    fi
    sleep 3
done
echo \"Timed out waiting for GR ONLINE on ${host} (last state=\${state})\" >&2
exit 1
'"
}
