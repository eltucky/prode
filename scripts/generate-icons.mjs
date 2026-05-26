import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

async function generate(size) {
  const r = Math.round(size * 0.2)
  const center = size / 2
  const ballR = Math.round(size * 0.33)
  const svg = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${r}" fill="#2563eb"/>
  <circle cx="${center}" cy="${center}" r="${ballR}" fill="white"/>
  <circle cx="${center}" cy="${center}" r="${ballR}" fill="none" stroke="#1d4ed8" stroke-width="${Math.round(size * 0.02)}"/>
  <line x1="${center}" y1="${center - ballR}" x2="${center}" y2="${center + ballR}" stroke="#1d4ed8" stroke-width="${Math.round(size * 0.02)}"/>
  <line x1="${center - ballR}" y1="${center}" x2="${center + ballR}" y2="${center}" stroke="#1d4ed8" stroke-width="${Math.round(size * 0.02)}"/>
</svg>`)
  await sharp(svg).png().toFile(`public/icons/icon-${size}.png`)
  console.log(`✓ public/icons/icon-${size}.png`)
}

await generate(192)
await generate(512)
