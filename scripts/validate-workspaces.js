// scripts/validate-workspaces.js
const fs = require('fs')
const path = require('path')

const base = path.resolve(__dirname, '../packages')

function scanPackages(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name)
      const relative = path.relative(base, fullPath)

      const packageJsonPath = path.join(fullPath, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        console.log(`✅ Found package: ${pkg.name} (${relative})`)
      } else {
        console.warn(`⚠️  No package.json in: ${relative}`)
      }

      // Recurse into subdirectories
      scanPackages(fullPath, `${prefix}${entry.name}/`)
    }
  }
}

console.log('🔍 Scanning packages/ for workspaces...\n')
scanPackages(base)

