import { initBackground } from './background'
import { games, type GameInfo } from './games-data'

// Initialize animated background
const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement
if (canvas) {
  initBackground(canvas)
}

// Render game gallery
const gallery = document.getElementById('gallery')

function createGameCard(game: GameInfo): HTMLElement {
  const card = document.createElement('a')
  card.className = 'game-card'
  card.href = game.path
  card.setAttribute('data-game-id', game.id)

  const previewHtml = game.preview
    ? `<img src="${game.preview}" alt="${game.name} preview" loading="lazy">`
    : `<div class="placeholder-preview"><span class="placeholder-icon">🎮</span></div>`

  card.innerHTML = `
    <div class="game-preview">
      ${previewHtml}
    </div>
    <div class="game-info">
      <h2 class="game-name">${game.name}</h2>
      <span class="play-button">
        <span>▶</span> Play Now
      </span>
    </div>
  `

  return card
}

function createEmptyState(): HTMLElement {
  const empty = document.createElement('div')
  empty.className = 'empty-state'
  empty.innerHTML = `
    <div class="empty-icon">📁</div>
    <h2 class="empty-title">No Games Yet</h2>
    <p class="empty-desc">
      Add a game folder with an index.html to the <code>dist/</code> directory to see it appear here.
    </p>
  `
  return empty
}

function renderGallery() {
  if (!gallery) return

  gallery.innerHTML = ''

  if (games.length === 0) {
    gallery.appendChild(createEmptyState())
  } else {
    games.forEach(game => {
      gallery.appendChild(createGameCard(game))
    })
  }
}

renderGallery()
