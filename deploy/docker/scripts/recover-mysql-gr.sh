#!/usr/bin/env bash
# Recover Group Replication when members are OFFLINE. Does not restart mysqld.
#
# If any member is ONLINE, START GROUP_REPLICATION on OFFLINE members.
# If all are OFFLINE, bootstrap the member whose gtid_executed contains the
# others (highest applied set), then join the rest.
#
# Run from cyberdev01. Never bootstrap more than one member.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

mysql_n() {
    local host="$1"
    local sql="$2"
    remote "${host}" "sudo bash -c '
set -a
source /srv/mysql/.env
set +a
docker exec mysql mysql -N -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"${sql}\"
'" 2>/dev/null | grep -v "Using a password" | tr -d '\r'
}

mysql_e() {
    local host="$1"
    local sql="$2"
    remote "${host}" "sudo bash -c '
set -euo pipefail
set -a
source /srv/mysql/.env
set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"${sql}\"
'"
}

echo "=== current members ==="
for host in "${DOCKS[@]}"; do
    echo "--- ${host} ---"
    mysql_n "${host}" "SELECT @@report_host, @@gtid_executed, @@super_read_only; SELECT MEMBER_HOST, MEMBER_STATE, MEMBER_ROLE FROM performance_schema.replication_group_members;"
done

declare -A GTID=()
ONLINE_HOST=""
OFFLINE_HOSTS=()

for host in "${DOCKS[@]}"; do
    gtid="$(mysql_n "${host}" "SELECT @@GLOBAL.gtid_executed;" | tail -1 | tr -d '[:space:]')"
    GTID["${host}"]="${gtid}"
    state="$(mysql_n "${host}" "SELECT IFNULL(MAX(MEMBER_STATE),\\\"NONE\\\") FROM performance_schema.replication_group_members WHERE MEMBER_HOST=@@report_host;" | tail -1 | tr -d '[:space:]')"
    echo "${host} state=${state}"
    if [[ "${state}" == "ONLINE" ]]; then
        ONLINE_HOST="${host}"
    else
        OFFLINE_HOSTS+=("${host}")
    fi
done

if [[ -n "${ONLINE_HOST}" ]]; then
    echo "Group exists (ONLINE on ${ONLINE_HOST}); joining OFFLINE members"
    for host in "${OFFLINE_HOSTS[@]}"; do
        echo "START GROUP_REPLICATION on ${host}"
        mysql_e "${host}" "START GROUP_REPLICATION;"
    done
else
    echo "All members OFFLINE; picking bootstrap source by GTID superset"
    bootstrap=""
    for host in "${DOCKS[@]}"; do
        is_superset=1
        for other in "${DOCKS[@]}"; do
            [[ "${host}" == "${other}" ]] && continue
            subset="$(mysql_n "${host}" "SELECT GTID_SUBSET('${GTID[$other]}', '${GTID[$host]}');" | tail -1 | tr -d '[:space:]')"
            if [[ "${subset}" != "1" ]]; then
                is_superset=0
                break
            fi
        done
        if [[ "${is_superset}" -eq 1 ]]; then
            bootstrap="${host}"
            break
        fi
    done
    if [[ -z "${bootstrap}" ]]; then
        echo "Could not find a GTID superset member. Inspect gtid_executed manually." >&2
        exit 1
    fi
    echo "Bootstrapping on ${bootstrap} (do not bootstrap another member)"
    mysql_e "${bootstrap}" "SET GLOBAL group_replication_bootstrap_group=ON; START GROUP_REPLICATION; SET GLOBAL group_replication_bootstrap_group=OFF;"
    sleep 3
    for host in "${DOCKS[@]}"; do
        [[ "${host}" == "${bootstrap}" ]] && continue
        echo "START GROUP_REPLICATION on ${host}"
        mysql_e "${host}" "START GROUP_REPLICATION;"
        sleep 3
    done
fi

echo "Waiting for all members ONLINE..."
deadline=$((SECONDS + 180))
while (( SECONDS < deadline )); do
    mapfile -t rows < <(mysql_n "${DOCKS[0]}" "SELECT CONCAT(MEMBER_HOST, \\\" \\\", MEMBER_STATE, \\\" \\\", MEMBER_ROLE) FROM performance_schema.replication_group_members ORDER BY MEMBER_HOST;")
    printf '%s\n' "${rows[@]}"
    online_n="$(mysql_n "${DOCKS[0]}" "SELECT COUNT(*) FROM performance_schema.replication_group_members WHERE MEMBER_STATE=\\\"ONLINE\\\";" | tail -1 | tr -d '[:space:]')"
    if [[ "${online_n}" == "${#DOCKS[@]}" ]]; then
        echo "All ${online_n} members ONLINE"
        exit 0
    fi
    sleep 3
done

echo "Timed out waiting for all members ONLINE" >&2
exit 1
