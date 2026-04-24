/**
 * Generates PWA icons (192x192 and 512x512) for libra-fleet/public/.
 * Uses the same pngjs strategy as gen-icon.js.
 */

const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '..', 'libra-fleet', 'public')

function makeIcon(size, outPath) {
  const png = new PNG({ width: size, height: size, filterType: -1 })

  const setPixel = (x, y, r, g, b, a = 255) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const idx = (size * y + x) * 4
    png.data[idx] = r
    png.data[idx + 1] = g
    png.data[idx + 2] = b
    png.data[idx + 3] = a
  }
  const fillRect = (x, y, w, h, r, g, b) => {
    for (let row = y; row < y + h; row++)
      for (let col = x; col < x + w; col++) setPixel(col, row, r, g, b)
  }
  const fillRoundRect = (x, y, w, h, rx, r, g, b) => {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        const dx = Math.min(col - x, x + w - 1 - col)
        const dy = Math.min(row - y, y + h - 1 - row)
        let inCorner = false
        if (dx < rx && dy < rx) {
          const cdx = rx - dx - 1, cdy = rx - dy - 1
          if (cdx * cdx + cdy * cdy > rx * rx) inCorner = true
        }
        if (!inCorner) setPixel(col, row, r, g, b)
      }
    }
  }

  // Background #1F3864
  fillRect(0, 0, size, size, 31, 56, 100)

  // Rounded inner card accent #2E75B6
  const pad = Math.floor(size * 0.12)
  fillRoundRect(pad, pad, size - pad * 2, size - pad * 2, Math.floor(size * 0.08), 46, 117, 182)

  // "LF" monogram in 7x5 pixel font, scaled up
  const L = [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,6],[2,6],[3,6]]
  const F = [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,0],[2,0],[3,0],[1,3],[2,3]]

  const scale = Math.floor(size / 14)
  const glyphW = 4 * scale
  const spacing = Math.floor(scale * 1.2)
  const totalW = glyphW + spacing + glyphW
  const startX = Math.floor((size - totalW) / 2)
  const startY = Math.floor((size - 7 * scale) / 2)

  const draw = (glyph, ox) => {
    glyph.forEach(([cx, cy]) => {
      fillRect(ox + cx * scale, startY + cy * scale, scale, scale, 214, 228, 240)
    })
  }
  draw(L, startX)
  draw(F, startX + glyphW + spacing)

  fs.writeFileSync(outPath, PNG.sync.write(png))
  console.log('Wrote', outPath)
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })
makeIcon(192, path.join(OUT_DIR, 'icon-192.png'))
makeIcon(512, path.join(OUT_DIR, 'icon-512.png'))
