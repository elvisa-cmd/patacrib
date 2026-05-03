#!/usr/bin/env node
/**
 * Generates PNG icons for the PataKrib PWA from icon.svg using sharp.
 * Run: node scripts/generate-icons.js
 * Requires: npm install --save-dev sharp
 */

const fs   = require('fs')
const path = require('path')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const SRC   = path.join(__dirname, '..', 'public', 'icons', 'icon.svg')
const DEST  = path.join(__dirname, '..', 'public', 'icons')

fs.mkdirSync(DEST, { recursive: true })

async function run() {
  let sharp
  try {
    sharp = require('sharp')
  } catch {
    console.error('sharp not installed. Run: npm install --save-dev sharp')
    console.error('Then re-run: node scripts/generate-icons.js')
    process.exit(1)
  }

  for (const size of SIZES) {
    const dest = path.join(DEST, `icon-${size}x${size}.png`)
    await sharp(SRC).resize(size, size).png().toFile(dest)
    console.log(`✓ ${dest}`)
  }

  console.log('\nAll icons generated.')
}

run().catch(err => { console.error(err); process.exit(1) })
