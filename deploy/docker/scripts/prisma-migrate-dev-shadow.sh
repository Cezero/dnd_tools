#!/usr/bin/env bash
# Full prisma migrate dev (shadow replay) against mysqldev. Slow (~minutes).
# Daily path is prisma-migrate-dev.sh (migrate diff, no replay).

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

BACKEND_ENV="${REPO_ROOT}/apps/backend/.env"

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
echo "prisma migrate dev (shadow replay) → 127.0.0.1:3307 (mysqldev)"
exec env DATABASE_URL="${dev_url}" pnpm exec prisma migrate dev "$@"
