const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function generateVessliIcon(width, height, isMaskable = false) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  // Colors:
  // Maroon: rgb(74, 14, 23) -> #4A0E17
  // Deep Maroon: rgb(46, 8, 14) -> #2E080E
  // Gold: rgb(212, 175, 55) -> #D4AF37
  // Light Gold: rgb(245, 222, 126) -> #F5DE7E
  // Soft Cream: rgb(250, 246, 238) -> #FAF6EE

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.46;
  const cornerRadius = isMaskable ? 0 : width * 0.22; // Maskable icons should bleed to edge, normal icons have rounded squircle

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // PNG filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Base background gradient: Deep Maroon to Rich Maroon
      const gradFactor = (x + y) / (width + height);
      let r = Math.round(74 * (1 - gradFactor * 0.3) + 40 * gradFactor * 0.3);
      let g = Math.round(14 * (1 - gradFactor * 0.3) + 8 * gradFactor * 0.3);
      let b = Math.round(23 * (1 - gradFactor * 0.3) + 14 * gradFactor * 0.3);
      let a = 255;

      // Squircle clipping for non-maskable (standard) icons
      if (!isMaskable) {
        // Distance from rounded box
        const dx = Math.max(0, Math.abs(x - cx) - (width * 0.44 - cornerRadius));
        const dy = Math.max(0, Math.abs(y - cy) - (height * 0.44 - cornerRadius));
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > cornerRadius) {
          a = 0; // Transparent outside
          r = 0;
          g = 0;
          b = 0;
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
          rawData[pixelOffset + 3] = a;
          continue;
        }
      }

      // Safe zone scale: if maskable, keep logo within 70% scale
      const scale = isMaskable ? 0.68 : 0.82;
      const nx = (x - cx) / (cx * scale); // -1 to +1
      const ny = (y - cy) / (cy * scale); // -1 to +1

      // Draw elegant "V" monogram:
      // Left arm from (-0.52, -0.55) to (0, 0.45), thickness ~0.16
      // Right arm from (0.52, -0.55) to (0, 0.45), thickness ~0.16
      let isV = false;
      let isHighlight = false;

      // Left branch: line equation
      const leftDist = Math.abs(ny - (1.92 * nx + 0.45));
      const rightDist = Math.abs(ny - (-1.92 * nx + 0.45));

      if (ny >= -0.55 && ny <= 0.48) {
        if (nx <= 0.08 && leftDist < 0.22 && nx >= -0.62) {
          isV = true;
          if (leftDist < 0.09 && nx < -0.1) isHighlight = true;
        } else if (nx >= -0.08 && rightDist < 0.22 && nx <= 0.62) {
          isV = true;
          if (rightDist < 0.09 && nx > 0.1) isHighlight = true;
        }
      }

      // Draw Diamond Star accent at top right of V (nx: 0.38..0.62, ny: -0.65..-0.35)
      const starDx = Math.abs(nx - 0.48);
      const starDy = Math.abs(ny - (-0.45));
      const isStar = (starDx * 1.8 + starDy * 1.8) < 0.18;

      // Gold border accent around squircle (subtle luxury ring)
      const isBorder = !isMaskable && Math.abs(Math.max(Math.abs(x - cx), Math.abs(y - cy)) - width * 0.43) < 2.5;

      if (isStar) {
        r = 255;
        g = 230;
        b = 140;
      } else if (isV) {
        if (isHighlight) {
          r = 245;
          g = 222;
          b = 126;
        } else {
          r = 212;
          g = 175;
          b = 55;
        }
      } else if (isBorder) {
        r = 212;
        g = 175;
        b = 55;
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return crc ^ (-1);
  }

  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const publicDir = path.resolve(__dirname, '../public');

// 1. pwa-192x192.png
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateVessliIcon(192, 192, false));
console.log('Generated pwa-192x192.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateVessliIcon(512, 512, false));
console.log('Generated pwa-512x512.png');

// 3. pwa-maskable-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateVessliIcon(512, 512, true));
console.log('Generated pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateVessliIcon(180, 180, false));
console.log('Generated apple-touch-icon.png');
