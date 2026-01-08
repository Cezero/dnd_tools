#!/bin/bash
# Initialize nvm for Cursor terminals
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Auto-use .nvmrc if present
if [ -f .nvmrc ] && [ -r .nvmrc ]; then
    nvm use > /dev/null 2>&1
fi
