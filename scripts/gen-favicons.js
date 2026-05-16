const sharp = require('sharp')
const fs    = require('fs')

const svg = Buffer.from(`
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="80" fill="#1a6b4a"/>
  <text x="256" y="340"
    font-family="Georgia, serif"
    font-size="320"
    font-weight="bold"
    fill="white"
    text-anchor="middle">P</text>
</svg>
`)

const sizes = [16, 32, 48, 96, 180, 192, 512]

async function generate() {
  for (const size of sizes) {
    await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}x${size}.png`)
    console.log(`Generated ${size}x${size}`)
  }
  await sharp(svg).resize(32,  32).png().toFile('public/favicon-32x32.png')
  await sharp(svg).resize(16,  16).png().toFile('public/favicon-16x16.png')
  await sharp(svg).resize(180,180).png().toFile('public/apple-touch-icon.png')
  await sharp(svg).resize(192,192).png().toFile('public/android-chrome-192x192.png')
  await sharp(svg).resize(512,512).png().toFile('public/android-chrome-512x512.png')
  console.log('All favicons generated')
}

generate().catch(console.error)
