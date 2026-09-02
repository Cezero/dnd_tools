#!/usr/bin/env bash
# Start MySQL Router on each dock against the local mysqld / GR group.
# Does not wipe /var/lib/mysql/router unless FORCE_ROUTER_BOOTSTRAP=1.
# Re-bootstrap only when the datadir has no mysqlrouter.conf.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

COMPOSE="/srv/mysql/router-compose.yml"

# HAProxy mysql-check (dndtools.cfg backend mysql_rw) needs a no-privilege
# native-password account with an empty password. Creates on the current PRIMARY.
ensure_haproxy_check_user() {
    local host
    for host in "${DOCKS[@]}"; do
        if remote "${host}" 'sudo bash -c "
set -euo pipefail
set -a
source /srv/mysql/.env
set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -P6446 -e \"
CREATE USER IF NOT EXISTS '\''haproxy'\''@'\''%'\'' IDENTIFIED WITH mysql_native_password BY '\'\'';
ALTER USER '\''haproxy'\''@'\''%'\'' IDENTIFIED WITH mysql_native_password BY '\'\'';
GRANT USAGE ON *.* TO '\''haproxy'\''@'\''%'\'';
FLUSH PRIVILEGES;
\"
"'; then
            echo "haproxy@% check user ensured via ${host}"
            return 0
        fi
        echo "Could not ensure haproxy@% via ${host}; trying next dock" >&2
    done
    echo "Could not create haproxy@% check user on PRIMARY" >&2
    return 1
}

for host in "${DOCKS[@]}"; do
    echo "Installing local compose on ${host}"
    install_compose_to_srv "${host}"
done

echo "Adopting Group Replication as InnoDB Cluster (once, for Router metadata)"
remote cyberdock01 'sudo bash -c "
set -a
source /srv/mysql/.env
set +a
if docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -N -e \"SHOW DATABASES LIKE '\''mysql_innodb_cluster_metadata'\'';\" | grep -q metadata; then
    echo InnoDB Cluster metadata already present
else
    docker run --rm --network host --entrypoint mysqlsh mysql/mysql-server:8.0 --js --user root --host 127.0.0.1 --password=\"\$MYSQL_ROOT_PASSWORD\" --execute \"dba.createCluster('\''mysql'\'', {adoptFromGR: true})\"
fi
"'

echo "Waiting for at least one GR member ONLINE before starting Router"
for _ in $(seq 1 60); do
    online="$(remote cyberdock01 'sudo bash -c "
set -a
source /srv/mysql/.env
set +a
docker exec mysql mysql -N -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"SELECT COUNT(*) FROM performance_schema.replication_group_members WHERE MEMBER_STATE=\\\"ONLINE\\\";\"
"' | tail -1 | tr -d '[:space:]')"
    if [[ "${online}" =~ ^[1-9][0-9]*$ ]]; then
        echo "GR ONLINE members: ${online}"
        break
    fi
    sleep 3
done

for host in "${DOCKS[@]}"; do
    echo "Starting router on ${host}"
    remote "${host}" "sudo bash -c '
set -a
source /srv/mysql/.env
set +a
mkdir -p /var/lib/mysql/router
if [[ \"${FORCE_ROUTER_BOOTSTRAP:-0}\" == \"1\" ]]; then
    echo Wiping router datadir on ${host}
    rm -rf /var/lib/mysql/router/*
fi
chown mysql:mysql /var/lib/mysql/router
docker compose --env-file /srv/mysql/.env -f ${COMPOSE} up -d
'"
done

echo "Waiting for router ports..."
for host in "${DOCKS[@]}"; do
    ok=0
    for _ in $(seq 1 30); do
        if remote "${host}" "sudo bash -c '
set -a
source /srv/mysql/.env
set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -P6446 -e \"SELECT 1\" >/dev/null
'"; then
            echo "${host}:6446 OK"
            ok=1
            break
        fi
        sleep 2
    done
    if [[ "${ok}" -ne 1 ]]; then
        echo "${host}:6446 failed" >&2
        remote "${host}" "sudo docker logs --tail 40 mysql-router" || true
        exit 1
    fi
done

ensure_haproxy_check_user
