# Node Version Management

This project uses Node.js version 22. The following files ensure the correct version is used:

- `.nvmrc` - Specifies Node 22 for nvm
- `package.json` - `engines` field specifies Node >=22.0.0 <23.0.0
- `.npmrc` - `engine-strict=true` enforces the engines field

## Quick Fix for Cursor Terminal

If your Cursor terminal shows Node 24 instead of Node 22, use one of these methods:

### Method 1: Source the project's init script (recommended)
```bash
source /home/countzero/git/dnd_tools/.bashrc.local
use-node22
```

This loads nvm and gives you the `use-node22` function.

### Method 2: Source the script directly
```bash
source /home/countzero/git/dnd_tools/use-node22.sh
```

### Method 3: Manual nvm switch
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22
```

**Note:** Scripts run in subshells, so you must **source** them (use `source` or `.`) rather than execute them directly.

## Verify Node Version

```bash
node --version  # Should show v22.x.x
which node       # Should show ~/.nvm/versions/node/v22...
```

## Automatic Switching

The `.bashrc` has been configured to automatically:
- Load nvm when you're in the dnd_tools directory
- Switch to Node 22 via PROMPT_COMMAND hook
- Source `.bashrc.local` when in the project

**Important:** After sourcing `.bashrc.local`, the `pnpm` command is automatically aliased to ensure Node 22 is used. This means:

1. Source the init script once: `source /home/countzero/git/dnd_tools/.bashrc.local`
2. Then you can run `pnpm run dev` directly - it will automatically use Node 22

However, Cursor terminals may not always respect these settings. If automatic switching doesn't work, manually run `use-node22` before pnpm commands.



