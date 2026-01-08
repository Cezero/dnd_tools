#!/bin/bash
# Script to switch to Node 22 using nvm

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

echo "Installing Node 22..."
nvm install 22

echo "Switching to Node 22..."
nvm use 22

echo "Setting Node 22 as default..."
nvm alias default 22

echo "Current Node version:"
node --version

echo "Done! Node 22 is now active."

