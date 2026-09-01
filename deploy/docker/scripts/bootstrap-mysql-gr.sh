#!/usr/bin/env bash
# Start MySQL on all docks and bootstrap Group Replication (single-primary).

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

COMPOSE="${DEPLOY_ROOT}/mysql/compose.yml"

mysql_exec() {
    local host="$1"
    shift
    remote "${host}" "source /srv/mysql/.env && sudo docker exec -i mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 $*"
}

wait_mysql() {
    local host="$1"
    echo "Waiting for MySQL on ${host}..."
    for _ in $(seq 1 90); do
        if remote "${host}" 'sudo bash -c "set -a; source /srv/mysql/.env; set +a; docker exec mysql mysqladmin ping -h127.0.0.1 -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --silent"' >/dev/null 2>&1; then
            echo "MySQL up on ${host}"
            return 0
        fi
        sleep 3
    done
    echo "MySQL did not become ready on ${host}" >&2
    return 1
}

for host in "${DOCKS[@]}"; do
    remote "${host}" "sudo docker compose --env-file /srv/mysql/.env -f ${COMPOSE} up -d"
done

for host in "${DOCKS[@]}"; do
    wait_mysql "${host}"
done

configure_node() {
    local host="$1"
    mysql_exec "${host}" <<'SQL'
SET SQL_LOG_BIN=0;
CREATE USER IF NOT EXISTS 'repl'@'%' IDENTIFIED BY '${MYSQL_REPL_PASSWORD}';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
GRANT BACKUP_ADMIN ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;
SET SQL_LOG_BIN=1;
CHANGE REPLICATION SOURCE TO SOURCE_USER='repl', SOURCE_PASSWORD='${MYSQL_REPL_PASSWORD}' FOR CHANNEL 'group_replication_recovery';
SQL
}

# Password substitution: run via remote shell so .env is sourced
setup_sql() {
    local host="$1"
    remote "${host}" 'sudo bash -c "set -a; source /srv/mysql/.env; set +a
docker exec -i mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 <<SQL
SET SQL_LOG_BIN=0;
CREATE USER IF NOT EXISTS '\''repl'\''@'\''%'\'' IDENTIFIED WITH mysql_native_password BY '\''\$MYSQL_REPL_PASSWORD'\'';
GRANT REPLICATION SLAVE ON *.* TO '\''repl'\''@'\''%'\'';
GRANT BACKUP_ADMIN ON *.* TO '\''repl'\''@'\''%'\'';
FLUSH PRIVILEGES;
SET SQL_LOG_BIN=1;
CHANGE REPLICATION SOURCE TO SOURCE_USER='\''repl'\'', SOURCE_PASSWORD='\''\$MYSQL_REPL_PASSWORD'\'', GET_SOURCE_PUBLIC_KEY=1 FOR CHANNEL '\''group_replication_recovery'\'';
SQL"'
}

for host in "${DOCKS[@]}"; do
    setup_sql "${host}"
done

echo "Bootstrapping group on cyberdock01"
remote cyberdock01 'sudo bash -c "set -a; source /srv/mysql/.env; set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"SET GLOBAL group_replication_bootstrap_group=ON; START GROUP_REPLICATION; SET GLOBAL group_replication_bootstrap_group=OFF;\""'

sleep 5

for host in cyberdock02 cyberdock03; do
    echo "Joining ${host}"
    remote "${host}" 'sudo bash -c "set -a; source /srv/mysql/.env; set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"START GROUP_REPLICATION;\""'
    sleep 5
done

echo "Group members:"
remote cyberdock01 'sudo bash -c "set -a; source /srv/mysql/.env; set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"SELECT MEMBER_HOST, MEMBER_PORT, MEMBER_STATE, MEMBER_ROLE FROM performance_schema.replication_group_members;\""'
