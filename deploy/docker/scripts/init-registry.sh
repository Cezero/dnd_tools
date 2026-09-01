#!/usr/bin/env bash
# Start the LAN Docker registry on this host (cyberdev01).

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

sudo mkdir -p /srv/registry/data
sudo install -m 0644 "${DEPLOY_ROOT}/registry/compose.yml" /srv/registry/compose.yml

docker compose -f /srv/registry/compose.yml up -d

echo "Registry listening on ${DND_REGISTRY}"
echo "Next: ${DEPLOY_ROOT}/scripts/configure-insecure-registry.sh"
echo "That restarts Docker Engine on this host and on all docks (brief outage)."
