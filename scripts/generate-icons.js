import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Minimal valid PNG generator in pure Node.js
function createPng(width, height, drawFn) {
  // RGBA buffer: (width * 4 + 1) * height bytes (with filter byte 0 per scanline)
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // Helper to calculate CRC32
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const typeAndData = buf.subarray(4, 8 + len);
    const crc = crc32(typeAndData);
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type 6: RGBA
  ihdrData[10] = 0; // Compression 0
  ihdrData[11] = 0; // Filter 0
  ihdrData[12] = 0; // Interlace 0
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Color Palette
// Background: Deep Navy #060c19 -> [6, 12, 25, 255]
// Accent Gold: #f59e0b -> [245, 158, 11, 255]
// Light Gold: #fde68a -> [253, 230, 138, 255]
// Bronze / Amber: #b45309 -> [180, 83, 9, 255]

function drawIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = w / 2;

  // Background deep navy
  let r = 6;
  let g = 12;
  let b = 25;
  let a = 255;

  // For regular icons, give a soft rounded container or full bleed
  const outerRadius = isMaskable ? maxRadius : maxRadius * 0.92;
  if (!isMaskable && dist > outerRadius) {
    return [0, 0, 0, 0]; // Transparent outer corners
  }

  // Golden outer ring
  const ringRadius = outerRadius * 0.85;
  const ringThickness = w * 0.035;
  if (Math.abs(dist - ringRadius) < ringThickness) {
    return [245, 158, 11, 255]; // Amber gold
  }

  // Inner subtle gradient
  const centerDistNorm = dist / ringRadius;
  if (dist < ringRadius) {
    // Darker blue center
    r = Math.round(6 + (1 - centerDistNorm) * 12);
    g = Math.round(12 + (1 - centerDistNorm) * 16);
    b = Math.round(25 + (1 - centerDistNorm) * 35);
  }

  // Draw 'A' letter / Crown / Upward chevron symbol ("Aliyah" = ascent)
  // Upward chevron peak at (cx, cy - h * 0.22)
  // Left foot at (cx - w * 0.18, cy + h * 0.20)
  // Right foot at (cx + w * 0.18, cy + h * 0.20)
  const scale = w / 512;
  const ny = (y - cy) / scale;
  const nx = (x - cx) / scale;

  // Diamond / Star at the very top (Ascent crown)
  const starDist = Math.hypot(nx, ny + 110);
  if (starDist < 20 * scale) {
    return [253, 230, 138, 255]; // Bright gold star
  }

  // Upward Arrow / Chevron Arms (representing Ascent / עלייה)
  const leftLegDist = Math.abs(ny - (nx * 1.5 - 20));
  const rightLegDist = Math.abs(ny - (-nx * 1.5 - 20));
  const isInsideHeight = ny >= -80 && ny <= 80;

  if (isInsideHeight && (leftLegDist < 26 || rightLegDist < 26)) {
    // Shaded Gold
    const goldFactor = (ny + 80) / 160;
    return [
      Math.round(253 - goldFactor * 30),
      Math.round(230 - goldFactor * 60),
      Math.round(138 - goldFactor * 100),
      255,
    ];
  }

  // Horizontal crossbar of 'A'
  if (Math.abs(ny - 20) < 14 && Math.abs(nx) < 48) {
    return [245, 158, 11, 255];
  }

  return [r, g, b, a];
}

// 1. Generate 192x192 PNG
const png192 = createPng(192, 192, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// 2. Generate 512x512 PNG
const png512 = createPng(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// 3. Generate 512x512 Maskable PNG (full bleed background)
const pngMaskable512 = createPng(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable512);

// 4. Generate 180x180 Apple Touch Icon
const pngApple = createPng(180, 180, (x, y, w, h) => drawIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

// 5. Generate SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#040813"/>
      <stop offset="50%" stop-color="#071126"/>
      <stop offset="100%" stop-color="#0a142c"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="210" fill="none" stroke="url(#gold)" stroke-width="8" opacity="0.6"/>
  <!-- Star of Ascent -->
  <polygon points="256,130 263,148 282,148 267,160 272,178 256,167 240,178 245,160 230,148 249,148" fill="#fef08a"/>
  <!-- Upward Ascent 'A' Glyphs -->
  <path d="M 256 160 L 160 360 L 205 360 L 228 310 L 284 310 L 307 360 L 352 360 Z M 256 248 L 240 285 L 272 285 Z" fill="url(#gold)"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

console.log('Successfully generated PWA icons in /public: 192x192, 512x512, maskable, apple-touch-icon, and icon.svg');
