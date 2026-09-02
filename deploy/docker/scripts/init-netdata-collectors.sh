#!/usr/bin/env bash
# One-time MySQL netdata@127.0.0.1 user plus cyberlb01 HAProxy collectors.
# Dock go.d jobs (MySQL/Redis/EMQX/httpcheck/portcheck) are Ansible:
#   cyberdeck-ansible inventory/group_vars/docks.yaml
# Does not print secrets.

set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

rand() {
    openssl rand -base64 24 | tr -d '/+=' | head -c 32
}

ensure_shared_netdata_password() {
    local host="$1"
    remote "${host}" 'sudo bash -c "
set -euo pipefail
f=/srv/mysql/shared.env
if [[ ! -f \"\$f\" ]]; then
    echo \"missing \$f\" >&2
    exit 1
fi
if grep -q \"^MYSQL_NETDATA_PASSWORD=\" \"\$f\"; then
    exit 0
fi
pw=\$(openssl rand -base64 24 | tr -d \"/+=\" | head -c 32)
printf \"MYSQL_NETDATA_PASSWORD=%s\\n\" \"\$pw\" >> \"\$f\"
chmod 0640 \"\$f\"
"'
}

copy_netdata_password_from() {
    local src="$1"
    local dest="$2"
    local pw
    pw="$(remote "${src}" 'sudo awk -F= "/^MYSQL_NETDATA_PASSWORD=/{print \$2}" /srv/mysql/shared.env')"
    if [[ -z "${pw}" ]]; then
        echo "MYSQL_NETDATA_PASSWORD missing on ${src}" >&2
        return 1
    fi
    remote "${dest}" "sudo bash -c '
set -euo pipefail
f=/srv/mysql/shared.env
if grep -q \"^MYSQL_NETDATA_PASSWORD=\" \"\$f\"; then
    sed -i \"s|^MYSQL_NETDATA_PASSWORD=.*|MYSQL_NETDATA_PASSWORD=${pw}|\" \"\$f\"
else
    printf \"MYSQL_NETDATA_PASSWORD=${pw}\\n\" >> \"\$f\"
fi
if grep -q \"^MYSQL_NETDATA_PASSWORD=\" /srv/mysql/.env 2>/dev/null; then
    sed -i \"s|^MYSQL_NETDATA_PASSWORD=.*|MYSQL_NETDATA_PASSWORD=${pw}|\" /srv/mysql/.env
else
    printf \"MYSQL_NETDATA_PASSWORD=${pw}\\n\" >> /srv/mysql/.env
fi
'"
}

primary_host() {
    local host member
    for host in "${DOCKS[@]}"; do
        member="$(remote "${host}" 'sudo bash -c "
set -a; source /srv/mysql/.env; set +a
docker exec mysql mysql -N -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"
SELECT MEMBER_HOST FROM performance_schema.replication_group_members
WHERE MEMBER_ROLE=\\\"PRIMARY\\\" AND MEMBER_STATE=\\\"ONLINE\\\" LIMIT 1;
\" 2>/dev/null | tail -1
"')"
        if [[ -n "${member}" ]]; then
            case "${member}" in
                192.168.0.89) echo cyberdock01; return 0 ;;
                192.168.0.90) echo cyberdock02; return 0 ;;
                192.168.0.93) echo cyberdock03; return 0 ;;
            esac
        fi
    done
    echo "No GR PRIMARY ONLINE" >&2
    return 1
}

ensure_mysql_netdata_user() {
    local host="$1"
    echo "Ensuring netdata MySQL user on ${host}"
    remote "${host}" 'sudo bash -c "
set -euo pipefail
set -a
source /srv/mysql/.env
source /srv/mysql/shared.env
set +a
docker exec mysql mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --protocol=TCP -h127.0.0.1 -e \"
CREATE USER IF NOT EXISTS '\''netdata'\''@'\''127.0.0.1'\'' IDENTIFIED WITH mysql_native_password BY '\''\$MYSQL_NETDATA_PASSWORD'\'';
ALTER USER '\''netdata'\''@'\''127.0.0.1'\'' IDENTIFIED WITH mysql_native_password BY '\''\$MYSQL_NETDATA_PASSWORD'\'';
GRANT USAGE, PROCESS, REPLICATION CLIENT ON *.* TO '\''netdata'\''@'\''127.0.0.1'\'';
GRANT SELECT ON performance_schema.* TO '\''netdata'\''@'\''127.0.0.1'\'';
FLUSH PRIVILEGES;
\"
"'
}

write_dock_collectors() {
    local host="$1"
    echo "Ensuring netdata docker group on ${host} (go.d jobs are Ansible)"
    remote "${host}" 'sudo usermod -aG docker netdata'
}

verify_dock_charts() {
    local host="$1"
    echo "Verifying Netdata charts on ${host}"
    remote "${host}" 'python3 - <<PY
import json, socket, time, urllib.request
deadline = time.time() + 90
api_up = False
while time.time() < deadline:
    try:
        with socket.create_connection(("127.0.0.1", 19999), 1):
            api_up = True
            raw = urllib.request.urlopen("http://127.0.0.1:19999/api/v1/charts", timeout=10).read()
            charts = json.loads(raw).get("charts", {})
            names = " ".join(charts)
            need = ("mysql_", "redis_", "portcheck_")
            missing = [p for p in need if p not in names]
            if not missing:
                docker_ok = "docker_" in names or "cgroup_" in names
                print("charts", len(charts), "docker", docker_ok)
                print("mysql/redis/portcheck present")
                raise SystemExit(0)
    except OSError:
        pass
    time.sleep(3)
if not api_up:
    raise SystemExit("netdata API did not listen on 127.0.0.1:19999")
raise SystemExit("timeout waiting for mysql/redis/portcheck charts")
PY
'
}

ensure_lb_haproxy_metrics() {
    echo "Ensuring HAProxy Prometheus exporter on cyberlb01"
    remote_root_lb 'sh -s' <<'EOF'
set -eu
cfg=/etc/haproxy/haproxy.cfg
if grep -q "frontend netdata_haproxy" "$cfg"; then
    echo "netdata_haproxy frontend already present"
else
    cat >> "$cfg" <<'HAP'
frontend netdata_haproxy
    mode http
    bind 127.0.0.1:8404
    http-request use-service prometheus-exporter if { path /metrics }
    stats enable
    stats uri /stats
    stats refresh 10s
HAP
    echo "appended netdata_haproxy frontend"
fi
haproxy -c -f "$cfg"
rc-service haproxy reload
wget -q -O- http://127.0.0.1:8404/metrics | head -c 80 >/dev/null
echo "HAProxy /metrics ok"
EOF
}

install_lb_netdata() {
    echo "Installing and claiming Netdata on cyberlb01"
    ssh "${SSH_OPTS[@]}" countzero@cyberdock01 'sudo cat /etc/netdata/claim.conf' \
        | ssh "${SSH_OPTS[@]}" root@cyberlb01 'cat > /tmp/dock-claim.conf'
    remote_root_lb 'sh -s' <<'EOF'
set -eu
if ! command -v netdata >/dev/null 2>&1 || ! netdata -v 2>/dev/null | grep -q '^netdata v2'; then
    wget -q -O /tmp/netdata-kickstart.sh https://get.netdata.cloud/kickstart.sh
    sh /tmp/netdata-kickstart.sh --non-interactive --stable-channel --disable-telemetry --dont-wait || true
fi
install -d -m 0755 /etc/netdata/go.d
cat > /etc/netdata/go.d/haproxy.conf <<'YML'
# Generated by init-netdata-collectors.sh
jobs:
  - name: local
    url: http://127.0.0.1:8404/metrics
YML
cat > /etc/netdata/go.d/portcheck.conf <<'YML'
# Generated by init-netdata-collectors.sh
jobs:
  - name: haproxy-frontends
    host: 127.0.0.1
    ports: [80, 3306, 6379, 1883, 18083, 8404]
YML
chmod 0640 /etc/netdata/go.d/haproxy.conf /etc/netdata/go.d/portcheck.conf
if id netdata >/dev/null 2>&1; then
    chown root:netdata /etc/netdata/go.d/haproxy.conf /etc/netdata/go.d/portcheck.conf || true
fi
token=$(awk -F= '/^[[:space:]]*token/{gsub(/[[:space:]]/,"",$2); print $2}' /tmp/dock-claim.conf)
url=$(awk -F= '/^[[:space:]]*url/{gsub(/[[:space:]]/,"",$2); print $2}' /tmp/dock-claim.conf)
rooms=$(awk -F= '/^[[:space:]]*rooms/{gsub(/[[:space:]]/,"",$2); print $2}' /tmp/dock-claim.conf)
rm -f /tmp/dock-claim.conf
if [ -n "$token" ] && [ -x /usr/sbin/netdata-claim.sh ]; then
    /usr/sbin/netdata-claim.sh -token="$token" -url="${url:-https://app.netdata.cloud}" ${rooms:+-rooms="$rooms"} >/dev/null
elif [ -n "$token" ] && [ -x /opt/netdata/bin/netdata-claim.sh ]; then
    /opt/netdata/bin/netdata-claim.sh -token="$token" -url="${url:-https://app.netdata.cloud}" ${rooms:+-rooms="$rooms"} >/dev/null
fi
if command -v rc-service >/dev/null 2>&1 && [ -f /etc/init.d/netdata ]; then
    rc-update add netdata default >/dev/null 2>&1 || true
    rc-service netdata restart || rc-service netdata start
elif command -v systemctl >/dev/null 2>&1; then
    systemctl enable --now netdata
    systemctl restart netdata
fi
echo "cyberlb01 netdata running"
EOF
}

echo "Ensuring MYSQL_NETDATA_PASSWORD in shared.env"
ensure_shared_netdata_password cyberdock01
for host in "${DOCKS[@]}"; do
    copy_netdata_password_from cyberdock01 "${host}"
done

pri="$(primary_host)"
echo "GR primary is ${pri}"
ensure_mysql_netdata_user "${pri}"

# Dock go.d files are owned by Ansible (group_vars/docks.yaml + netdata role).
# Still ensure docker group + localhost web API so existing agents keep working
# until the playbook is applied.
for host in "${DOCKS[@]}"; do
    write_dock_collectors "${host}"
done

ensure_lb_haproxy_metrics
install_lb_netdata

echo "MySQL netdata user and cyberlb01 collectors configured."
echo "Apply Ansible netdata role for dock go.d jobs (EMQX, httpcheck, portcheck)."
