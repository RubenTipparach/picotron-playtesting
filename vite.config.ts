import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

// Plugin to copy game folders from dist/games to final build
function copyGamesPlugin() {
  return {
    name: 'copy-games',
    closeBundle() {
      const gamesSourceDir = resolve(__dirname, 'dist/games')
      const gamesBuildDir = resolve(__dirname, 'dist')

      if (fs.existsSync(gamesSourceDir)) {
        const games = fs.readdirSync(gamesSourceDir)
        games.forEach(game => {
          const src = resolve(gamesSourceDir, game)
          const dest = resolve(gamesBuildDir, game)
          if (fs.statSync(src).isDirectory()) {
            fs.cpSync(src, dest, { recursive: true })
          }
        })
      }
    }
  }
}

export default defineConfig({
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    emptyDir: false, // Don't delete existing game folders!
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      }
    }
  },
  plugins: [copyGamesPlugin()]
})
