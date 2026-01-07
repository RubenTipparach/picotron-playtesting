import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const publicDir = path.resolve(__dirname, '../public')
const distDir = path.resolve(__dirname, '../dist')

// Improvements to apply to Picotron HTML exports
const htmlImprovements = {
  // Better viewport meta tag for mobile
  viewportMeta: '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">',

  // Additional CSS for better mobile experience
  additionalCSS: `
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    /* Safe area insets for notched phones */
    body {
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
      box-sizing: border-box;
    }
    /* Prevent pull-to-refresh */
    body {
      overscroll-behavior: none;
    }
    /* Better canvas rendering */
    canvas {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      -ms-interpolation-mode: nearest-neighbor;
    }
    /* Landscape mode: fullscreen game, hide touch controls */
    @media screen and (orientation: landscape) and (max-height: 500px) {
      #touch_controls_gfx, #touch_controls_background,
      #controls_left_panel, #controls_right_panel,
      .p8_menu_button, #p8_menu_buttons, #p8_menu_buttons_touch {
        display: none !important;
        visibility: hidden !important;
      }
      #p8_playarea {
        margin-top: 0 !important;
      }
      #canvas {
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
      }
      #p8_container {
        width: 100vw !important;
        height: 100vh !important;
      }
      body {
        padding: 0 !important;
      }
    }
  `,

  // JavaScript to override the 2/3 limit in landscape
  landscapeFullscreenJS: `
    // Override for landscape fullscreen
    var originalP8UpdateLayout = p8_update_layout;
    p8_update_layout = function() {
      var isLandscape = window.innerWidth > window.innerHeight;
      var isSmallScreen = window.innerHeight < 500;
      if (isLandscape && isSmallScreen && p8_touch_detected && p8_is_running) {
        var canvas = document.getElementById("canvas");
        var p8_container = document.getElementById("p8_container");
        var p8_playarea = document.getElementById("p8_playarea");
        if (canvas && p8_container && p8_playarea) {
          var w = window.innerWidth;
          var h = window.innerHeight;
          // Scale to fit screen while maintaining 16:9 aspect ratio
          var scale = Math.min(w / 480, h / 270);
          var cw = Math.floor(480 * scale);
          var ch = Math.floor(270 * scale);
          canvas.style.width = cw + "px";
          canvas.style.height = ch + "px";
          canvas.style.marginLeft = Math.floor((w - cw) / 2) + "px";
          canvas.style.marginTop = Math.floor((h - ch) / 2) + "px";
          p8_container.style.width = cw + "px";
          p8_container.style.height = ch + "px";
          p8_playarea.style.marginTop = "0";
          // Hide touch controls in landscape
          var hide = ["touch_controls_gfx", "touch_controls_background"];
          hide.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.style.display = "none";
          });
          requestAnimationFrame(p8_update_layout);
          return;
        }
      }
      originalP8UpdateLayout();
    };
  `
}

function processGameHtml(html: string, gameName: string): string {
  let processed = html

  // 1. Replace viewport meta tag with improved version
  processed = processed.replace(
    /<meta name="viewport"[^>]*>/i,
    htmlImprovements.viewportMeta
  )

  // 2. Add apple-mobile-web-app meta tags for iOS
  const appleMetas = `
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#222222">`

  processed = processed.replace(
    '</head>',
    `${appleMetas}\n<style>${htmlImprovements.additionalCSS}</style>\n</head>`
  )

  // 3. Update title to game name
  processed = processed.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${gameName}</title>`
  )

  // 4. Keep autoplay disabled - let users click to start
  // (autoplay causes Module.pico8Boot errors when module isn't ready)

  // 5. Enable touch controls (commented out in Picotron exports)
  processed = processed.replace(
    /\/\/ \*\* commented for first release; no touch controls yet \*\*\s*\n\s*\/\/ addEventListener\("touchstart", function\(event\)\{p8_touch_detected = true; \},\s*\{passive: true\}\);/,
    '// Touch controls enabled by build script\n\taddEventListener("touchstart", function(event){p8_touch_detected = true; },  {passive: true});'
  )

  // 6. Add landscape fullscreen JavaScript before </body>
  processed = processed.replace(
    '</body>',
    `<script>${htmlImprovements.landscapeFullscreenJS}</script>\n</body>`
  )

  return processed
}

function formatGameName(folderName: string): string {
  return folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function processGames() {
  console.log('Processing games from public/ to dist/...')

  if (!fs.existsSync(publicDir)) {
    console.log('No public directory found')
    return
  }

  // Ensure dist exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }

  const entries = fs.readdirSync(publicDir, { withFileTypes: true })
  let processedCount = 0

  for (const entry of entries) {
    // Skip non-directories and special folders
    if (!entry.isDirectory()) continue
    if (entry.name === 'previews') continue

    const gameSourceDir = path.join(publicDir, entry.name)
    const indexPath = path.join(gameSourceDir, 'index.html')

    // Skip if no index.html
    if (!fs.existsSync(indexPath)) {
      console.log(`  Skipping ${entry.name} (no index.html)`)
      continue
    }

    const gameDistDir = path.join(distDir, entry.name)
    const gameName = formatGameName(entry.name)

    // Create dist game folder
    if (!fs.existsSync(gameDistDir)) {
      fs.mkdirSync(gameDistDir, { recursive: true })
    }

    // Read, process, and write the HTML
    const originalHtml = fs.readFileSync(indexPath, 'utf-8')
    const processedHtml = processGameHtml(originalHtml, gameName)

    fs.writeFileSync(path.join(gameDistDir, 'index.html'), processedHtml)

    // Copy any other files (like preview images)
    const gameFiles = fs.readdirSync(gameSourceDir)
    for (const file of gameFiles) {
      if (file === 'index.html') continue
      const srcFile = path.join(gameSourceDir, file)
      const destFile = path.join(gameDistDir, file)
      fs.copyFileSync(srcFile, destFile)
    }

    console.log(`  Processed: ${gameName}`)
    processedCount++
  }

  // Copy preview images to dist
  const previewsSourceDir = path.join(publicDir, 'previews')
  const previewsDistDir = path.join(distDir, 'previews')

  if (fs.existsSync(previewsSourceDir)) {
    if (!fs.existsSync(previewsDistDir)) {
      fs.mkdirSync(previewsDistDir, { recursive: true })
    }
    const previews = fs.readdirSync(previewsSourceDir)
    for (const preview of previews) {
      fs.copyFileSync(
        path.join(previewsSourceDir, preview),
        path.join(previewsDistDir, preview)
      )
    }
    if (previews.length > 0) {
      console.log(`  Copied ${previews.length} preview image(s)`)
    }
  }

  console.log(`Done! Processed ${processedCount} game(s)`)
}

processGames()
