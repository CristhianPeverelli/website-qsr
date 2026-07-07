import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const distDir = join(process.cwd(), 'dist', 'spa')
const indexPath = join(distDir, 'index.html')
const routes = ['delta-e', 'timer', 'labyrinthus', 'privacy', 'my-last-work']

if (!existsSync(indexPath)) {
  throw new Error(`Missing build entry: ${indexPath}`)
}

for (const route of routes) {
  const routeDir = join(distDir, route)
  mkdirSync(routeDir, { recursive: true })
  copyFileSync(indexPath, join(routeDir, 'index.html'))
}

copyFileSync(indexPath, join(distDir, '404.html'))

console.log(`Copied SPA entry for ${routes.length} direct routes and 404 fallback.`)
