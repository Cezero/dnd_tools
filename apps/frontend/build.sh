#!/usr/bin/bash
# Build and deploy both app images via the shared compose deploy script.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec "${ROOT}/deploy/docker/scripts/deploy-app.sh"
