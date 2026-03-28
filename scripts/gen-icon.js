/**
 * Generates icon.png (256x256) and icon.ico from the SVG using
 * the pngjs library (already installed as devDependency).
 *
 * Renders the SVG by parsing shapes manually for the truck design,
 * since we have no canvas/browser available.
 *
 * Strategy: use electron's built-in ability to accept PNG directly,
 * and generate a PNG using pure Node.js pixel manipulation via pngjs.
 */

const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')

const SIZE = 256

const png = new PNG({ width: SIZE, height: SIZE, filterType: -1 })

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
  const idx = (SIZE * y + x) * 4
  png.data[idx]     = r
  png.data[idx + 1] = g
  png.data[idx + 2] = b
  png.data[idx + 3] = a
}

function fillRect(x, y, w, h, r, g, b, a = 255) {
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      setPixel(col, row, r, g, b, a)
    }
  }
}

function fillCircle(cx, cy, radius, r, g, b, a = 255) {
  for (let row = cy - radius; row <= cy + radius; row++) {
    for (let col = cx - radius; col <= cx + radius; col++) {
      const dx = col - cx, dy = row - cy
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(col, row, r, g, b, a)
      }
    }
  }
}

function fillRoundRect(x, y, w, h, rx, r, g, b, a = 255) {
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      // Check corner roundness
      let inCorner = false
      const dx = Math.min(col - x, x + w - 1 - col)
      const dy = Math.min(row - y, y + h - 1 - row)
      if (dx < rx && dy < rx) {
        const cdx = rx - dx - 1, cdy = rx - dy - 1
        if (cdx * cdx + cdy * cdy > rx * rx) inCorner = true
      }
      if (!inCorner) setPixel(col, row, r, g, b, a)
    }
  }
}

// Polygon fill (scanline)
function fillPolygon(points, r, g, b, a = 255) {
  const minY = Math.floor(Math.min(...points.map(p => p[1])))
  const maxY = Math.ceil(Math.max(...points.map(p => p[1])))
  for (let y = minY; y <= maxY; y++) {
    const intersections = []
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i]
      const [x2, y2] = points[(i + 1) % points.length]
      if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
        const x = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
        intersections.push(x)
      }
    }
    intersections.sort((a, b) => a - b)
    for (let i = 0; i < intersections.length - 1; i += 2) {
      for (let x = Math.ceil(intersections[i]); x <= Math.floor(intersections[i + 1]); x++) {
        setPixel(x, y, r, g, b, a)
      }
    }
  }
}

function drawLine(x1, y1, x2, y2, r, g, b, thick = 1) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = Math.round(x1 + (x2 - x1) * t)
    const y = Math.round(y1 + (y2 - y1) * t)
    for (let dx = -Math.floor(thick/2); dx <= Math.floor(thick/2); dx++) {
      for (let dy = -Math.floor(thick/2); dy <= Math.floor(thick/2); dy++) {
        setPixel(x + dx, y + dy, r, g, b)
      }
    }
  }
}

// ── Background circle ──────────────────────────────────────────────
fillCircle(128, 128, 128, 15, 23, 42) // #0f172a

// ── Cargo area (blue rectangle) ───────────────────────────────────
fillRoundRect(28, 90, 130, 80, 6, 37, 99, 235)  // #2563eb

// Cargo door vertical lines (darker blue)
for (let i = 0; i < 3; i++) {
  const x = [60, 93, 126][i]
  drawLine(x, 92, x, 168, 29, 78, 216, 2)
}

// ── Cab body ──────────────────────────────────────────────────────
fillPolygon([[158,168],[228,168],[228,120],[158,120]], 37, 99, 235)

// Cab roof curve (trapezoid approximation)
fillPolygon([
  [158, 120], [228, 120], [228, 95], [210, 88], [185, 87], [163, 98]
], 59, 130, 246) // #3b82f6

// ── Windshield ────────────────────────────────────────────────────
fillPolygon([
  [166, 118], [222, 118], [222, 100], [210, 94], [182, 95]
], 147, 197, 253, 200) // #93c5fd semi

// ── Side window ───────────────────────────────────────────────────
fillRoundRect(163, 124, 30, 28, 3, 147, 197, 253, 180)

// ── Chassis ───────────────────────────────────────────────────────
fillRoundRect(28, 168, 200, 12, 3, 30, 58, 138) // #1e3a8a

// ── Front bumper ──────────────────────────────────────────────────
fillRoundRect(220, 160, 14, 20, 3, 30, 58, 138)

// ── Headlight ─────────────────────────────────────────────────────
fillRoundRect(223, 108, 10, 8, 2, 253, 224, 71) // #fde047

// ── Grille lines ──────────────────────────────────────────────────
fillRoundRect(223, 125, 10, 18, 2, 30, 58, 138)
for (let i = 0; i < 4; i++) {
  drawLine(225, 128 + i * 4, 231, 128 + i * 4, 59, 130, 246, 1)
}

// ── Exhaust pipe ──────────────────────────────────────────────────
fillRoundRect(148, 72, 8, 22, 4, 55, 65, 81) // #374151
fillCircle(152, 72, 4, 75, 85, 99)            // #4b5563

// ── Wheels ────────────────────────────────────────────────────────
const wheels = [68, 110, 200]
wheels.forEach(cx => {
  const cy = 182
  fillCircle(cx, cy, 22, 15, 23, 42)   // outer black
  fillCircle(cx, cy, 18, 55, 65, 81)   // tire gray
  fillCircle(cx, cy, 10, 31, 41, 55)   // inner dark
  fillCircle(cx, cy, 5,  107, 114, 128) // hub
})

// ── Speed lines ───────────────────────────────────────────────────
drawLine(8, 130, 27, 130, 59, 130, 246, 3)
drawLine(4, 145, 27, 145, 59, 130, 246, 2)
drawLine(12, 115, 27, 115, 59, 130, 246, 2)

// ── "LIBRA" text on cargo (pixel text approximation) ──────────────
// Simple block letters drawn manually at y≈133, x≈42..115
// We'll skip pixel font and instead draw a colored band label
fillRect(38, 128, 108, 22, 15, 23, 42, 120) // dark bg strip

// Draw simplified letter blocks spelling LIBRA
const letters = [
  // L
  [[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4]],
  // I
  [[4,0],[4,1],[4,2],[4,3],[4,4]],
  // B
  [[6,0],[6,1],[6,2],[6,3],[6,4],[7,0],[8,0],[7,2],[8,2],[8,1],[7,4],[8,4],[8,3]],
  // R
  [[10,0],[10,1],[10,2],[10,3],[10,4],[11,0],[12,0],[12,1],[11,2],[12,3],[12,4]],
  // A
  [[14,1],[14,2],[14,3],[14,4],[15,0],[16,0],[16,1],[16,2],[16,3],[16,4],[15,2]],
]

const lx = 44, ly = 130, scale = 3
letters.forEach(letter => {
  letter.forEach(([cx, cy]) => {
    fillRect(lx + cx * scale * 2, ly + cy * scale, scale*2-1, scale-1, 147, 197, 253)
  })
  lx // just iterate, offset handled by index
})

// Actually let's do it properly with offsets
const offsets = [0, 7, 10, 16, 22]
const scale2 = 2
const startX = 44, startY = 131

letters.forEach((letter, li) => {
  const ox = startX + offsets[li] * scale2 * 2
  letter.forEach(([cx, cy]) => {
    fillRect(ox + cx * scale2 * 2, startY + cy * scale2, scale2 * 2, scale2, 147, 197, 253)
  })
})

// ── Write PNG ─────────────────────────────────────────────────────
const assetsDir = path.join(__dirname, '..', 'assets')
const pngPath = path.join(assetsDir, 'icon.png')

const buffer = PNG.sync.write(png)
fs.writeFileSync(pngPath, buffer)
console.log('icon.png written:', pngPath)

// ── Write ICO (Windows) ───────────────────────────────────────────
// ICO format: supports multiple sizes. We'll embed 256x256 PNG directly.
// ICO with PNG compression is supported since Windows Vista.
function makePngIco(pngBuffer) {
  const numImages = 1
  // ICONDIR header: 6 bytes
  const icondir = Buffer.alloc(6)
  icondir.writeUInt16LE(0, 0)       // reserved
  icondir.writeUInt16LE(1, 2)       // type = 1 (icon)
  icondir.writeUInt16LE(numImages, 4)

  // ICONDIRENTRY: 16 bytes
  const entry = Buffer.alloc(16)
  entry.writeUInt8(0, 0)            // width: 0 = 256
  entry.writeUInt8(0, 1)            // height: 0 = 256
  entry.writeUInt8(0, 2)            // color count
  entry.writeUInt8(0, 3)            // reserved
  entry.writeUInt16LE(1, 4)         // planes
  entry.writeUInt16LE(32, 6)        // bit count
  entry.writeUInt32LE(pngBuffer.length, 8)   // size of image data
  entry.writeUInt32LE(6 + 16, 12)   // offset of image data

  return Buffer.concat([icondir, entry, pngBuffer])
}

const icoBuffer = makePngIco(buffer)
const icoPath = path.join(assetsDir, 'icon.ico')
fs.writeFileSync(icoPath, icoBuffer)
console.log('icon.ico written:', icoPath)

console.log('Icons generated successfully!')
