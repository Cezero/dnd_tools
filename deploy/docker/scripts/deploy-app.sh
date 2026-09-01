#!/usr/bin/env bash
# Build app images on this machine, push to the LAN registry, pull on docks.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

COMPOSE="/srv/dnd-tools/compose.yml"
TARGET="${1:-all}"
BACKEND_IMAGE="${DND_REGISTRY}/dnd-tools-backend:${APP_TAG}"
FRONTEND_IMAGE="${DND_REGISTRY}/dnd-tools-frontend:${APP_TAG}"

case "${TARGET}" in
    all|backend|frontend) ;;
    *)
        echo "Usage: $0 [all|backend|frontend]" >&2
        exit 1
        ;;
esac

cd "${REPO_ROOT}"

if ! wget -qO- -T 3 "http://${DND_REGISTRY}/v2/" >/dev/null 2>&1 \
    && ! curl -fsS --max-time 3 "http://${DND_REGISTRY}/v2/" >/dev/null 2>&1; then
    echo "Registry not reachable at http://${DND_REGISTRY}/v2/" >&2
    echo "Start it with ${DEPLOY_ROOT}/scripts/init-registry.sh" >&2
    echo "Allow HTTP with ${DEPLOY_ROOT}/scripts/configure-insecure-registry.sh" >&2
    exit 1
fi

build_push() {
    local dockerfile="$1"
    local image="$2"
    docker build -f "${dockerfile}" -t "${image}" .
    docker push "${image}"
}

if [[ "${TARGET}" == "all" || "${TARGET}" == "backend" ]]; then
    build_push apps/backend/Dockerfile "${BACKEND_IMAGE}"
fi
if [[ "${TARGET}" == "all" || "${TARGET}" == "frontend" ]]; then
    build_push apps/frontend/Dockerfile "${FRONTEND_IMAGE}"
fi

compose_services=()
if [[ "${TARGET}" == "all" ]]; then
    compose_services=()
elif [[ "${TARGET}" == "backend" ]]; then
    compose_services=(backend)
else
    compose_services=(frontend)
fi

for host in "${DOCKS[@]}"; do
    echo "Pulling on ${host}"
    install_compose_to_srv "${host}"
    if [[ "${TARGET}" == "all" || "${TARGET}" == "backend" ]]; then
        remote "${host}" "sudo docker pull ${BACKEND_IMAGE}"
    fi
    if [[ "${TARGET}" == "all" || "${TARGET}" == "frontend" ]]; then
        remote "${host}" "sudo docker pull ${FRONTEND_IMAGE}"
    fi
    if ((${#compose_services[@]})); then
        remote "${host}" "sudo docker compose --env-file /srv/dnd-tools/.env -f ${COMPOSE} up -d ${compose_services[*]}"
    else
        remote "${host}" "sudo docker compose --env-file /srv/dnd-tools/.env -f ${COMPOSE} up -d"
    fi
done

for host in "${DOCKS[@]}"; do
    echo -n "${host} health: "
    remote "${host}" "wget -qO- -T 5 http://127.0.0.1:3001/health && echo"
    remote "${host}" "sudo docker exec dnd-tools-backend id"
    remote "${host}" "sudo docker exec dnd-tools-frontend id"
done
