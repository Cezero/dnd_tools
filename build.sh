#!/usr/bin/bash
# Build application images and deploy them to all three docks.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
exec "${ROOT}/deploy/docker/scripts/deploy-app.sh"
