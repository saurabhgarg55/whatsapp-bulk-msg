import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const PUBLIC_DIR = path.resolve('public');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 1. Write public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0E284A"/>
      <stop offset="100%" stop-color="#071526"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#DFBA63"/>
      <stop offset="100%" stop-color="#B38933"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <!-- Background with rounded corners -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)"/>
  <!-- Gold Border Accent -->
  <rect x="24" y="24" width="464" height="464" rx="80" fill="none" stroke="url(#goldGrad)" stroke-width="8" opacity="0.85"/>
  <!-- Inner Troika Emblem -->
  <g filter="url(#shadow)">
    <!-- Elegant Serif 'T' Monogram -->
    <path d="M 140 160 L 372 160 C 382 160 390 168 390 178 L 390 195 C 390 205 382 213 372 213 L 286 213 L 286 380 C 286 390 278 398 268 398 L 244 398 C 234 398 226 390 226 380 L 226 213 L 140 213 C 130 213 122 205 122 195 L 122 178 C 122 168 130 160 140 160 Z" fill="url(#goldGrad)"/>
    <!-- Small Troika Star Accent -->
    <circle cx="256" cy="430" r="10" fill="#DFBA63"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), svgContent, 'utf-8');
console.log('Created public/icon.svg');

// PNG Generator Helper
function createPNG(width, height, getPixel) {
  const rowSize = width * 4;
  const raw = Buffer.alloc((rowSize + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowSize + 1)] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const offset = y * (rowSize + 1) + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcVal = zlib.crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Generate Troika Branded Icons
function generateIcon(size, isMaskable) {
  const scale = size / 512;
  // Colors
  const navyR = 11, navyG = 31, navyB = 58;
  const darkNavyR = 7, darkNavyG = 21, darkNavyB = 38;
  const goldR = 201, goldG = 162, goldB = 75;
  const lightGoldR = 223, lightGoldG = 186, lightGoldB = 99;

  return createPNG(size, size, (x, y) => {
    // Normalised coords (-1 to 1)
    const nx = (x / size) * 2 - 1;
    const ny = (y / size) * 2 - 1;
    const dist = Math.sqrt(nx * nx + ny * ny);

    // If maskable, safe zone has 15% margin around, background is full bleed
    const cornerRadius = isMaskable ? 0 : 0.22;
    const absX = Math.abs(nx);
    const absY = Math.abs(ny);

    // Rounded rectangle check for non-maskable
    if (!isMaskable) {
      if (absX > 0.96 || absY > 0.96) {
        return [0, 0, 0, 0]; // Transparent outside
      }
      if (absX > 0.74 && absY > 0.74) {
        const cx = absX - 0.74;
        const cy = absY - 0.74;
        if (cx * cx + cy * cy > 0.22 * 0.22) {
          return [0, 0, 0, 0];
        }
      }
    }

    // Gradient background
    const tY = (ny + 1) / 2;
    const bgR = Math.round(navyR * (1 - tY * 0.35));
    const bgG = Math.round(navyG * (1 - tY * 0.35));
    const bgB = Math.round(navyB * (1 - tY * 0.35));

    // Scale padding for letter 'T'
    const padFactor = isMaskable ? 0.75 : 0.88;
    const letterX = nx / padFactor;
    const letterY = ny / padFactor;

    // Check letter 'T' geometry
    // Crossbar: Y between -0.42 and -0.22, X between -0.52 and 0.52
    const inCrossbar = letterY >= -0.42 && letterY <= -0.22 && Math.abs(letterX) <= 0.52;
    // Stem: Y between -0.22 and 0.48, X between -0.12 and 0.12
    const inStem = letterY >= -0.22 && letterY <= 0.48 && Math.abs(letterX) <= 0.12;
    // Star / dot: Y between 0.60 and 0.68, radius 0.04
    const inDot = Math.hypot(letterX, letterY - 0.64) <= 0.04;

    // Border (gold ring)
    const inBorder = !isMaskable && (
      (absX >= 0.88 && absX <= 0.92 && absY <= 0.90) ||
      (absY >= 0.88 && absY <= 0.92 && absX <= 0.90)
    );

    if (inCrossbar || inStem || inDot || inBorder) {
      // Gold gradient
      const goldT = (letterY + 0.5) / 1.0;
      const r = Math.round(lightGoldR * (1 - goldT * 0.18));
      const g = Math.round(lightGoldG * (1 - goldT * 0.18));
      const b = Math.round(lightGoldB * (1 - goldT * 0.18));
      return [r, g, b, 255];
    }

    return [bgR, bgG, bgB, 255];
  });
}

// Write the files
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-192x192.png'), generateIcon(192, false));
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-512x512.png'), generateIcon(512, false));
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png'), generateIcon(512, true));
fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), generateIcon(180, false));
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), generateIcon(64, false));

console.log('All PWA icon assets generated successfully in public/');
