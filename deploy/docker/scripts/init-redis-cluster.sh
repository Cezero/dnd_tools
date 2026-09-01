#!/usr/bin/env bash
# Start two Redis instances per dock and form a 3-master / 3-replica cluster.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

COMPOSE="/srv/redis/compose.yml"

for host in "${DOCKS[@]}"; do
    install_compose_to_srv "${host}"
    remote "${host}" "sudo install -d -o redis -g redis -m 0750 /var/lib/redis/6379 /var/lib/redis/6380
sudo docker compose --env-file /srv/redis/.env -f ${COMPOSE} up -d"
done

echo "Waiting for Redis nodes..."
sleep 8

remote cyberdock01 'sudo bash -c "
set -a
source /srv/redis/.env
set +a
docker exec redis-6379 redis-cli -a \"\$REDIS_PASSWORD\" --no-auth-warning --cluster create \
  192.168.0.89:6379 192.168.0.90:6379 192.168.0.93:6379 \
  192.168.0.90:6380 192.168.0.93:6380 192.168.0.89:6380 \
  --cluster-replicas 1 --cluster-yes
"'

echo "Cluster nodes:"
remote cyberdock01 'sudo bash -c "
set -a
source /srv/redis/.env
set +a
docker exec redis-6379 redis-cli -a \"\$REDIS_PASSWORD\" --no-auth-warning cluster nodes
"'
