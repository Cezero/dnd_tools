#!/usr/bin/env bash
# Fast schema change: migrate diff against mysqldev (no shadow replay), write
# prisma/migrations/<timestamp>_<name>/, apply on 127.0.0.1:3307 only.
# Promote with prisma-migrate-deploy.sh. Does not touch cybersql.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

BACKEND_ENV="${REPO_ROOT}/apps/backend/.env"
SCHEMA="${REPO_ROOT}/apps/backend/prisma/schema.prisma"
MIGRATIONS="${REPO_ROOT}/apps/backend/prisma/migrations"

usage() {
    echo "Usage: $0 --name <migration_name>" >&2
    exit 2
}

name=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --name)
            [[ $# -ge 2 ]] || usage
            name="$2"
            shift 2
            ;;
        --name=*)
            name="${1#*=}"
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown argument: $1" >&2
            usage
            ;;
    esac
done

if [[ -z "${name}" ]]; then
    usage
fi

if [[ ! "${name}" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "--name must be letters, numbers, or underscore (e.g. add_spell_slot)" >&2
    exit 1
fi

if [[ ! -f "${BACKEND_ENV}" ]]; then
    echo "Missing ${BACKEND_ENV}" >&2
    exit 1
fi

dev_url="$(python3 - "${BACKEND_ENV}" <<'PY'
import pathlib
import sys

text = pathlib.Path(sys.argv[1]).read_text()
for raw in text.splitlines():
    line = raw.strip()
    if line.startswith("DATABASE_URL_DEV="):
        value = line.split("=", 1)[1].strip().strip('"').strip("'")
        print(value)
        raise SystemExit(0)
raise SystemExit("DATABASE_URL_DEV is not set in apps/backend/.env (run init-mysqldev.sh)")
PY
)"

if [[ -z "${dev_url}" ]]; then
    echo "DATABASE_URL_DEV is empty" >&2
    exit 1
fi

if ! docker inspect -f '{{.State.Running}}' mysqldev 2>/dev/null | grep -q true; then
    echo "mysqldev is not running. Start it with deploy/docker/scripts/init-mysqldev.sh" >&2
    exit 1
fi

cd "${REPO_ROOT}/apps/backend"
echo "prisma migrate diff → mysqldev (no shadow replay)"

sql="$(
    env DATABASE_URL="${dev_url}" pnpm exec prisma migrate diff \
        --from-url "${dev_url}" \
        --to-schema-datamodel "${SCHEMA}" \
        --script
)"

if ! python3 -c '
import sys
text = sys.argv[1]
body = []
for line in text.splitlines():
    stripped = line.strip()
    if not stripped or stripped.startswith("--"):
        continue
    body.append(stripped)
raise SystemExit(0 if body else 1)
' "${sql}"; then
    echo "schema.prisma matches mysqldev. Nothing to write."
    exit 0
fi

stamp="$(date -u +%Y%m%d%H%M%S)"
folder="${MIGRATIONS}/${stamp}_${name}"
if [[ -e "${folder}" ]]; then
    echo "Already exists: ${folder}" >&2
    exit 1
fi

mkdir -p "${folder}"
printf '%s\n' "${sql}" > "${folder}/migration.sql"
echo "Wrote ${folder}/migration.sql"

echo "Applying to mysqldev only"
env DATABASE_URL="${dev_url}" pnpm exec prisma migrate deploy

echo "Promote when ready: ${DEPLOY_ROOT}/scripts/prisma-migrate-deploy.sh"
