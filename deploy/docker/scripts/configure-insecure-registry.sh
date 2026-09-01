#!/usr/bin/env bash
# Add DND_REGISTRY to Docker Engine insecure-registries (HTTP LAN registry).
# Restarts docker on cyberdev01 and each dock — MySQL/Redis/EMQX/app bounce.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

MERGE_PY="${DEPLOY_ROOT}/scripts/merge-insecure-registry.py"

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

apply_daemon_json() {
    local host="$1"
    scp "${SSH_OPTS[@]}" "${MERGE_PY}" "${host}:/tmp/merge-insecure-registry.py"
    remote "${host}" "sudo mkdir -p /etc/docker
if [ -f /etc/docker/daemon.json ]; then sudo cp /etc/docker/daemon.json /tmp/daemon.json.in
else echo '{}' | sudo tee /tmp/daemon.json.in >/dev/null
fi
sudo python3 /tmp/merge-insecure-registry.py ${DND_REGISTRY} /tmp/daemon.json.in
sudo install -m 0644 /tmp/daemon.json.in /etc/docker/daemon.json
sudo rm -f /tmp/merge-insecure-registry.py /tmp/daemon.json.in"
}

echo "Updating insecure-registries=${DND_REGISTRY} on $(hostname -s)"
sudo mkdir -p /etc/docker
if [[ -f /etc/docker/daemon.json ]]; then
    sudo cp /etc/docker/daemon.json /tmp/daemon.json.in
else
    echo '{}' | sudo tee /tmp/daemon.json.in >/dev/null
fi
sudo python3 "${MERGE_PY}" "${DND_REGISTRY}" /tmp/daemon.json.in
sudo install -m 0644 /tmp/daemon.json.in /etc/docker/daemon.json
sudo rm -f /tmp/daemon.json.in
sudo systemctl restart docker
echo "Restarted docker on $(hostname -s)"

if [[ -f /srv/registry/compose.yml ]]; then
    docker compose -f /srv/registry/compose.yml up -d
fi

for host in "${DOCKS[@]}"; do
    echo "Updating insecure-registries on ${host} (restarts docker)"
    apply_daemon_json "${host}"
    ensure_dock_compose_env "${host}"
    remote "${host}" "sudo systemctl restart docker"
    echo "Restarted docker on ${host}"
done

echo "Insecure registry ${DND_REGISTRY} configured. Run deploy-app.sh next."
