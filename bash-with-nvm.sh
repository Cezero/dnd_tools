#!/bin/bash
# Wrapper script that ensures nvm is loaded before starting bash
# This script is used by Cursor's terminal profile

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Source the project's .bashrc.local
if [ -f "/home/countzero/git/dnd_tools/.bashrc.local" ]; then
    source "/home/countzero/git/dnd_tools/.bashrc.local"
fi

# Start interactive bash with all initialization files
exec bash --login


