// Dynamic animated background with floating particles and grid

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
}

interface Star {
  x: number
  y: number
  size: number
  twinkleSpeed: number
  twinklePhase: number
}

export function initBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  let width = window.innerWidth
  let height = window.innerHeight
  let animationId: number

  const colors = ['#7c3aed', '#06b6d4', '#f472b6', '#a855f7', '#3b82f6']
  const particles: Particle[] = []
  const stars: Star[] = []
  const particleCount = Math.min(50, Math.floor((width * height) / 20000))
  const starCount = Math.min(100, Math.floor((width * height) / 10000))

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }

  function createParticle(): Particle {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.2
    }
  }

  function createStar(): Star {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2
    }
  }

  // Initialize particles and stars
  for (let i = 0; i < particleCount; i++) {
    particles.push(createParticle())
  }
  for (let i = 0; i < starCount; i++) {
    stars.push(createStar())
  }

  function drawGrid() {
    const gridSize = 50
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.05)'
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  function drawStars(time: number) {
    stars.forEach(star => {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size * twinkle, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  function drawParticles() {
    particles.forEach(p => {
      // Update position
      p.x += p.vx
      p.y += p.vy

      // Wrap around screen
      if (p.x < 0) p.x = width
      if (p.x > width) p.x = 0
      if (p.y < 0) p.y = height
      if (p.y > height) p.y = 0

      // Draw particle with glow
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
      gradient.addColorStop(0, p.color)
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.globalAlpha = p.alpha
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })
  }

  function drawConnections() {
    const maxDistance = 150

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          const alpha = (1 - distance / maxDistance) * 0.15
          ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    )
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(1, 'rgba(10, 10, 15, 0.8)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  function animate(time: number) {
    // Clear with dark background
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, width, height)

    drawGrid()
    drawStars(time)
    drawConnections()
    drawParticles()
    drawVignette()

    animationId = requestAnimationFrame(animate)
  }

  // Setup
  resize()
  window.addEventListener('resize', resize)
  animate(0)

  // Return cleanup function
  return () => {
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', resize)
  }
}
