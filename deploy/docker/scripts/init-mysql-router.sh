#!/usr/bin/env bash
# Bootstrap MySQL Router on each dock against the local mysqld / GR group.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

COMPOSE="/srv/mysql/router-compose.yml"

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

for host in "${DOCKS[@]}"; do
    echo "Bootstrapping router on ${host}"
    remote "${host}" "sudo bash -c '
set -a
source /srv/mysql/.env
set +a
rm -rf /var/lib/mysql/router/*
mkdir -p /var/lib/mysql/router
chown mysql:mysql /var/lib/mysql/router
docker compose --env-file /srv/mysql/.env -f ${COMPOSE} up -d
'"
done

echo "Waiting for router ports..."
sleep 10
for host in "${DOCKS[@]}"; do
    remote "${host}" "sudo bash -c '
set -a
source /srv/mysql/.env
set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -P6446 -e \"SELECT 1\"
' && echo ${host}:6446 OK"
done
