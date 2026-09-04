#!/usr/bin/env bash
# prisma migrate deploy to live cyberdnd (DATABASE_URL in apps/backend/.env, cybersql).
# Agents must not run this.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

BACKEND_ENV="${REPO_ROOT}/apps/backend/.env"

if [[ ! -f "${BACKEND_ENV}" ]]; then
    echo "Missing ${BACKEND_ENV}" >&2
    exit 1
fi

host="$(python3 - "${BACKEND_ENV}" <<'PY'
import pathlib
import sys
from urllib.parse import urlparse

text = pathlib.Path(sys.argv[1]).read_text()
for raw in text.splitlines():
    line = raw.strip()
    if line.startswith("DATABASE_URL=") and not line.startswith("DATABASE_URL_DEV="):
        value = line.split("=", 1)[1].strip().strip('"').strip("'")
        parsed = urlparse(value)
        print(f"{parsed.hostname}:{parsed.port or 3306}/{parsed.path.lstrip('/')}")
        raise SystemExit(0)
raise SystemExit("DATABASE_URL is not set in apps/backend/.env")
PY
)"

cd "${REPO_ROOT}/apps/backend"
echo "prisma migrate deploy → ${host}"
exec pnpm exec prisma migrate deploy "$@"
