// Tiny PNG decoder (8-bit RGB/RGBA, non-interlaced) using Node's zlib — enough
// to sample pixels from Puppeteer screenshots without extra dependencies.
const zlib = require('zlib');

function decode(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let pos = 8, width = 0, height = 0, bitDepth = 0, colorType = 0; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos); const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; if (data[12] !== 0) throw new Error('interlaced PNG unsupported'); }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error('only 8-bit PNG supported');
  const channels = { 2: 3, 6: 4, 0: 1, 4: 2 }[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels; const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride), p = 0;
  for (let y = 0; y < height; y++) {
    const f = raw[p++]; const row = Buffer.from(raw.subarray(p, p + stride)); p += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? row[i - channels] : 0, b = prev[i], c = i >= channels ? prev[i - channels] : 0;
      let v = row[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      row[i] = v & 255;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4, s = x * channels;
      if (channels >= 3) { out[o] = row[s]; out[o + 1] = row[s + 1]; out[o + 2] = row[s + 2]; out[o + 3] = channels === 4 ? row[s + 3] : 255; }
      else { out[o] = out[o + 1] = out[o + 2] = row[s]; out[o + 3] = channels === 2 ? row[s + 1] : 255; }
    }
    prev = row;
  }
  return { width, height, data: out };
}

function px(img, x, y) { const o = (y * img.width + x) * 4; return [img.data[o], img.data[o + 1], img.data[o + 2]]; }
function meanLum(img, x0 = 0, y0 = 0, x1 = img.width, y1 = img.height, step = 4) {
  let sum = 0, n = 0;
  for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) { const [r, g, b] = px(img, x, y); sum += 0.2126 * r + 0.7152 * g + 0.0722 * b; n++; }
  return sum / n;
}
function meanRGB(img, x0, y0, x1, y1, step = 4) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) { const p = px(img, x, y); r += p[0]; g += p[1]; b += p[2]; n++; }
  return [r / n, g / n, b / n].map(v => Math.round(v));
}
// fraction of sampled pixels that differ by more than `thr` in any channel
function diffFraction(a, b, thr = 24, step = 3) {
  let n = 0, d = 0;
  for (let y = 0; y < a.height; y += step) for (let x = 0; x < a.width; x += step) {
    const o = (y * a.width + x) * 4; n++;
    if (Math.abs(a.data[o] - b.data[o]) > thr || Math.abs(a.data[o + 1] - b.data[o + 1]) > thr || Math.abs(a.data[o + 2] - b.data[o + 2]) > thr) d++;
  }
  return d / n;
}
module.exports = { decode, px, meanLum, meanRGB, diffFraction };
