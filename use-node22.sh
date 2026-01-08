#!/bin/bash
# Standalone script to switch to Node 22
# This script must be SOURCED, not executed: source use-node22.sh
# Or use: . use-node22.sh

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Error: This script must be sourced, not executed."
    echo "Usage: source $0"
    echo "   Or: . $0"
    exit 1
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd /home/countzero/git/dnd_tools 2>/dev/null
nvm use 22
echo "✓ Now using Node $(node --version)"
