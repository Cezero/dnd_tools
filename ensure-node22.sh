#!/bin/bash
# Script to ensure Node 22 is active in the current shell
# Source this file: source ensure-node22.sh

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check if we're in a directory with .nvmrc
if [ -f .nvmrc ]; then
    nvm use > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ Using Node $(node --version) (from .nvmrc)"
    else
        echo "⚠ Warning: Could not switch to Node version from .nvmrc"
        echo "  Current Node version: $(node --version)"
    fi
else
    # Try to use Node 22 if available
    if nvm list 22 > /dev/null 2>&1; then
        nvm use 22 > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✓ Using Node $(node --version)"
        fi
    fi
fi





