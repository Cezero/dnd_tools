#!/usr/bin/env bash
# Merge Feature + FeatureProgression on the GR primary (Jan 2026 dump schema).
# Stops backends first so Group Replication is not blocked by app connections.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

SQL="${DEPLOY_ROOT}/scripts/merge-feature-progression.sql"

if [[ ! -f "${SQL}" ]]; then
    echo "Missing ${SQL}" >&2
    exit 1
fi

echo "Stopping backends on all docks"
for host in "${DOCKS[@]}"; do
    remote "${host}" 'sudo docker stop dnd-tools-backend || true'
done

restart_backends() {
    echo "Starting backends"
    for host in "${DOCKS[@]}"; do
        remote "${host}" 'sudo docker start dnd-tools-backend' || true
    done
}
trap restart_backends ERR

echo "Copying merge SQL to cyberdock01 /tmp"
scp "${SSH_OPTS[@]}" "${SQL}" cyberdock01:/tmp/merge-feature-progression.sql

echo "Applying Feature merge on cyberdock01"
ssh "${SSH_OPTS[@]}" cyberdock01 'sudo bash -c "set -a; source /srv/mysql/.env; set +a
docker exec -i mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 \"\$MYSQL_DATABASE\"" < /tmp/merge-feature-progression.sql'

echo "Group members"
remote cyberdock01 'sudo bash -c "set -a; source /srv/mysql/.env; set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"SELECT MEMBER_HOST, MEMBER_STATE, MEMBER_ROLE FROM performance_schema.replication_group_members;\""'

echo "Starting backends"
for host in "${DOCKS[@]}"; do
    remote "${host}" 'sudo docker start dnd-tools-backend'
done

echo "Feature merge complete"
