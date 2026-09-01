#!/usr/bin/env python3
"""Merge a host:port into Docker Engine insecure-registries and write daemon.json."""

from __future__ import annotations

import json
import os
import sys


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: merge-insecure-registry.py <registry-host:port> <daemon.json>", file=sys.stderr)
        sys.exit(1)
    registry = sys.argv[1]
    path = sys.argv[2]
    data: dict[str, object] = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as handle:
            raw = handle.read().strip()
            if raw:
                loaded = json.loads(raw)
                if isinstance(loaded, dict):
                    data = loaded
    regs = data.get("insecure-registries") or []
    if not isinstance(regs, list):
        regs = []
    if registry not in regs:
        regs.append(registry)
    data["insecure-registries"] = regs
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)
        handle.write("\n")


if __name__ == "__main__":
    main()
