#!/usr/bin/env bash
# Add DND_REGISTRY to Docker Engine insecure-registries (HTTP LAN registry).
#
# Docker Engine only reloads insecure-registries on restart. Restarting every
# dock at once takes Group Replication down (no members left to rejoin).
# This script skips restart when daemon.json is already correct, and otherwise
# restarts one dock at a time, waiting for that member to be GR ONLINE before
# the next. Set FORCE_DOCKER_RESTART=1 to restart even when unchanged.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

MERGE_PY="${DEPLOY_ROOT}/scripts/merge-insecure-registry.py"
FORCE_DOCKER_RESTART="${FORCE_DOCKER_RESTART:-0}"

ensure_dock_compose_env() {
    local host="$1"
    remote "${host}" "sudo bash -c '
set -euo pipefail
envf=/srv/dnd-tools/.env
mkdir -p /srv/dnd-tools
touch \"\$envf\"
if grep -q \"^DND_REGISTRY=\" \"\$envf\"; then
    sed -i \"s|^DND_REGISTRY=.*|DND_REGISTRY=${DND_REGISTRY}|\" \"\$envf\"
else
    printf \"\\nDND_REGISTRY=${DND_REGISTRY}\\n\" >> \"\$envf\"
fi
if grep -q \"^APP_TAG=\" \"\$envf\"; then
    sed -i \"s|^APP_TAG=.*|APP_TAG=${APP_TAG}|\" \"\$envf\"
else
    printf \"APP_TAG=${APP_TAG}\\n\" >> \"\$envf\"
fi
chmod 0640 \"\$envf\"
'"
}

# Merge insecure-registries on a remote host. Prints CHANGED or UNCHANGED.
apply_daemon_json() {
    local host="$1"
    scp "${SSH_OPTS[@]}" "${MERGE_PY}" "${host}:/tmp/merge-insecure-registry.py"
    remote "${host}" "sudo bash -c '
set -euo pipefail
mkdir -p /etc/docker
if [ -f /etc/docker/daemon.json ]; then
    cp /etc/docker/daemon.json /tmp/daemon.json.in
else
    echo \"{}\" > /tmp/daemon.json.in
fi
python3 /tmp/merge-insecure-registry.py ${DND_REGISTRY} /tmp/daemon.json.in
if [ -f /etc/docker/daemon.json ] && cmp -s /etc/docker/daemon.json /tmp/daemon.json.in; then
    echo UNCHANGED
else
    install -m 0644 /tmp/daemon.json.in /etc/docker/daemon.json
    echo CHANGED
fi
rm -f /tmp/merge-insecure-registry.py /tmp/daemon.json.in
'"
}

restart_local_docker_if_needed() {
    local changed="$1"
    if [[ "${changed}" == "CHANGED" || "${FORCE_DOCKER_RESTART}" == "1" ]]; then
        echo "Restarting docker on $(hostname -s)"
        sudo systemctl restart docker
    else
        echo "daemon.json unchanged on $(hostname -s); not restarting docker"
    fi
}

echo "Updating insecure-registries=${DND_REGISTRY} on $(hostname -s)"
sudo mkdir -p /etc/docker
local_changed="CHANGED"
if [[ -f /etc/docker/daemon.json ]]; then
    sudo cp /etc/docker/daemon.json /tmp/daemon.json.in
else
    echo '{}' | sudo tee /tmp/daemon.json.in >/dev/null
fi
sudo python3 "${MERGE_PY}" "${DND_REGISTRY}" /tmp/daemon.json.in
if [[ -f /etc/docker/daemon.json ]] && sudo cmp -s /etc/docker/daemon.json /tmp/daemon.json.in; then
    local_changed="UNCHANGED"
else
    sudo install -m 0644 /tmp/daemon.json.in /etc/docker/daemon.json
    local_changed="CHANGED"
fi
sudo rm -f /tmp/daemon.json.in
restart_local_docker_if_needed "${local_changed}"

if [[ -f /srv/registry/compose.yml ]]; then
    docker compose -f /srv/registry/compose.yml up -d
fi

for host in "${DOCKS[@]}"; do
    echo "Updating insecure-registries on ${host}"
    changed="$(apply_daemon_json "${host}" | tail -1)"
    ensure_dock_compose_env "${host}"
    if [[ "${changed}" == "CHANGED" || "${FORCE_DOCKER_RESTART}" == "1" ]]; then
        echo "Restarting docker on ${host}"
        remote "${host}" "sudo systemctl restart docker"
        wait_dock_gr_online "${host}"
    else
        echo "daemon.json unchanged on ${host}; not restarting docker"
    fi
done

echo "Insecure registry ${DND_REGISTRY} configured. Run deploy-app.sh next."
