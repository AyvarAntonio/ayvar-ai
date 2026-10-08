import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Usa el mismo diseño de icons/ayvar.svg y varias muestras por píxel para suavizar los bordes del PNG.
const directory = fileURLToPath(new URL('../public/icons/', import.meta.url));
mkdirSync(directory, { recursive: true });
const polygon = [[130,356],[244,126],[280,126],[394,356],[331,356],[300,291],[214,291],[239,241],[276,241],[260,205],[186,356]];
function inside(x, y) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result;
  }
  return result;
}
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
}
function generate(size, filename) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
        const px = (x + (sx + .5) / 3) / size * 512;
        const py = (y + (sy + .5) / 3) / size * 512;
        const color = inside(px, py) ? [192, 248, 120]
          : Math.hypot(px - 375, py - 142) < 17 ? [106, 232, 210]
          : [16, 23, 17];
        color.forEach((value, channel) => { sum[channel] += value; });
      }
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      sum.forEach((value, channel) => { raw[offset + channel] = Math.round(value / 9); });
      raw[offset + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  writeFileSync(`${directory}/${filename}`, png);
  console.log(`Generated ${filename} (${size}×${size})`);
}
generate(192, 'icon-192.png');
generate(512, 'icon-512.png');
generate(512, 'icon-maskable-512.png');
generate(180, 'apple-touch-icon.png');
