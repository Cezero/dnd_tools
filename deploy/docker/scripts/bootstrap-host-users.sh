#!/usr/bin/env bash
# Create shared infrastructure users and data directories on a dock host.
# Intended to run via: sudo ./bootstrap-host-users.sh
#
# Users are generic (mysql, redis, emqx) because those services are shared.
# dnd-tools is application-specific.

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
    echo "Run as root (sudo $0)" >&2
    exit 1
fi

declare -A USERS=(
    [mysql]=910
    [redis]=911
    [dnd-tools]=912
    [emqx]=913
)

declare -A HOMES=(
    [mysql]=/var/lib/mysql
    [redis]=/var/lib/redis
    [dnd-tools]=/var/lib/dnd-tools
    [emqx]=/var/lib/emqx
)

ensure_user() {
    local name="$1"
    local uid="$2"
    local home="$3"

    if getent group "${name}" >/dev/null; then
        local existing_gid
        existing_gid="$(getent group "${name}" | cut -d: -f3)"
        if [[ "${existing_gid}" != "${uid}" ]]; then
            echo "Group ${name} exists with GID ${existing_gid}, expected ${uid}" >&2
            exit 1
        fi
    else
        groupadd --system --gid "${uid}" "${name}"
    fi

    if getent passwd "${name}" >/dev/null; then
        local existing_uid
        existing_uid="$(getent passwd "${name}" | cut -d: -f3)"
        if [[ "${existing_uid}" != "${uid}" ]]; then
            echo "User ${name} exists with UID ${existing_uid}, expected ${uid}" >&2
            exit 1
        fi
    else
        useradd --system --uid "${uid}" --gid "${uid}" \
            --home-dir "${home}" --shell /usr/sbin/nologin "${name}"
    fi

    install -d -o "${name}" -g "${name}" -m 0750 "${home}"
}

for name in mysql redis dnd-tools emqx; do
    ensure_user "${name}" "${USERS[$name]}" "${HOMES[$name]}"
done

install -d -o redis -g redis -m 0750 /var/lib/redis/6379 /var/lib/redis/6380
install -d -o emqx -g emqx -m 0750 /var/lib/emqx/data /var/lib/emqx/log
install -d -o mysql -g mysql -m 0750 /var/lib/mysql /var/lib/mysql/data /var/lib/mysql/router
install -d -o root -g dnd-tools -m 0750 /srv/dnd-tools
install -d -o root -g mysql -m 0750 /srv/mysql
install -d -o root -g redis -m 0750 /srv/redis
install -d -o root -g emqx -m 0750 /srv/emqx

echo "Host users ready:"
id mysql
id redis
id dnd-tools
id emqx
ls -ld /var/lib/mysql /var/lib/redis /var/lib/redis/6379 /var/lib/redis/6380 \
    /var/lib/emqx /var/lib/dnd-tools /srv/mysql /srv/redis /srv/emqx /srv/dnd-tools
