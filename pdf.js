// „legacy“-Fassung: läuft auch auf älteren iPhones, iPads und Android-Geräten
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const TARGET_WIDTH = 1300; // Pixelbreite der gerenderten Seite

// Liest eine PDF ein. Pro Seite entstehen:
// - der Text (bearbeitbar), aufgeteilt in Titel und Beschreibung
// - die Grafik der Seite, automatisch ausgeschnitten (Ausschnitt später änderbar)
export async function processPdf(file, onProgress) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let n = 1; n <= pdf.numPages; n++) {
    onProgress?.(n, pdf.numPages);
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const content = await page.getTextContent();
    const text = joinText(content.items);
    const textBoxes = content.items.map((item) => textBox(item, viewport)).filter(Boolean);
    const crop = detectGraphic(ctx, canvas.width, canvas.height, textBoxes);

    const fullBlob = await canvasToImage(canvas);
    const blob = crop ? await cropCanvas(canvas, crop) : fullBlob;
    const { width, height } = canvas;
    canvas.width = canvas.height = 0; // Speicher auf dem Handy sofort freigeben

    const title = guessTitle(text, file.name, n);
    pages.push({
      pageNumber: n,
      width,
      height,
      fullBlob,
      fullUrl: URL.createObjectURL(fullBlob),
      blob,
      previewUrl: URL.createObjectURL(blob),
      crop, // null = ganze Seite
      text: stripTitle(text, title),
      title,
    });
    page.cleanup();
  }
  await pdf.destroy();
  return pages;
}

// Schneidet aus dem gespeicherten Seitenbild einen Bereich aus (für die Ausschnitt-Korrektur)
export async function cropBlob(fullBlob, crop) {
  if (!crop) return fullBlob;
  const img = await loadImage(fullBlob);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d').drawImage(img, 0, 0);
  const out = await cropCanvas(canvas, crop);
  canvas.width = canvas.height = 0;
  return out;
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild konnte nicht geladen werden.')); };
    img.src = url;
  });
}

async function cropCanvas(source, { x, y, w, h }) {
  const c = document.createElement('canvas');
  c.width = Math.round(w);
  c.height = Math.round(h);
  const cx = c.getContext('2d');
  cx.fillStyle = '#ffffff';
  cx.fillRect(0, 0, c.width, c.height);
  cx.drawImage(source, x, y, w, h, 0, 0, c.width, c.height);
  const blob = await canvasToImage(c);
  c.width = c.height = 0;
  return blob;
}

// Position eines Textstücks auf der gerenderten Seite
function textBox(item, viewport) {
  if (!item.str || !item.str.trim()) return null;
  const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
  const fontHeight = Math.hypot(tx[2], tx[3]);
  const width = item.width * viewport.scale;
  if (!fontHeight || !width) return null;
  return { x: tx[4], y: tx[5] - fontHeight, w: width, h: fontHeight * 1.25 };
}

// Findet die größte Zeichnung auf der Seite: Text wird ausgeblendet, dann wird das
// größte zusammenhängende Gebiet mit Linien/Flächen gesucht.
function detectGraphic(ctx, W, H, textBoxes) {
  const CELL = 13;
  const cols = Math.ceil(W / CELL);
  const rows = Math.ceil(H / CELL);
  const { data } = ctx.getImageData(0, 0, W, H);

  // 1. Zellen mit „Tinte“ zählen
  const ink = new Uint16Array(cols * rows);
  for (let y = 0; y < H; y += 2) {
    const row = Math.floor(y / CELL) * cols;
    for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4;
      if (data[i] < 225 || data[i + 1] < 225 || data[i + 2] < 225) ink[row + Math.floor(x / CELL)]++;
    }
  }

  // 2. Zellen mit Text ausblenden
  const blocked = new Uint8Array(cols * rows);
  for (const b of textBoxes) {
    const c0 = Math.max(0, Math.floor(b.x / CELL)), c1 = Math.min(cols - 1, Math.floor((b.x + b.w) / CELL));
    const r0 = Math.max(0, Math.floor(b.y / CELL)), r1 = Math.min(rows - 1, Math.floor((b.y + b.h) / CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) blocked[r * cols + c] = 1;
  }

  const filled = new Uint8Array(cols * rows);
  for (let i = 0; i < filled.length; i++) filled[i] = ink[i] > 1 && !blocked[i] ? 1 : 0;

  // 3. Lücken schließen (Linien durch Beschriftungen wieder verbinden)
  const grown = new Uint8Array(cols * rows);
  const R = 2;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (!filled[r * cols + c]) continue;
    for (let dr = -R; dr <= R; dr++) for (let dc = -R; dc <= R; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) grown[rr * cols + cc] = 1;
    }
  }

  // 4. Größtes zusammenhängendes Gebiet suchen
  const seen = new Uint8Array(cols * rows);
  let best = null;
  const stack = [];
  for (let start = 0; start < grown.length; start++) {
    if (!grown[start] || seen[start]) continue;
    let count = 0, minR = rows, maxR = 0, minC = cols, maxC = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop();
      const r = Math.floor(i / cols), c = i % cols;
      if (filled[i]) count++;
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (c < minC) minC = c; if (c > maxC) maxC = c;
      for (const j of [i - cols, i + cols, c > 0 ? i - 1 : -1, c < cols - 1 ? i + 1 : -1]) {
        if (j >= 0 && j < grown.length && grown[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    if (!best || count > best.count) best = { count, minR, maxR, minC, maxC };
  }
  if (!best) return null;

  const x = Math.max(0, (best.minC + R) * CELL - 20);
  const y = Math.max(0, (best.minR + R) * CELL - 20);
  const x2 = Math.min(W, (best.maxC - R + 1) * CELL + 20);
  const y2 = Math.min(H, (best.maxR - R + 1) * CELL + 20);
  const w = x2 - x, h = y2 - y;

  // Zu klein (keine echte Grafik) oder fast die ganze Seite: ganze Seite verwenden
  if (w * h < W * H * 0.03 || w < 120 || h < 80) return null;
  if (w * h > W * H * 0.85) return null;
  return { x, y, w, h };
}

// WebP ist am kleinsten. Safari kann kein WebP erzeugen, dann nehmen wir JPEG.
async function canvasToImage(canvas) {
  const toBlob = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = await toBlob('image/webp', 0.85);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg', 0.88);
  if (!blob) throw new Error('Die Seite konnte nicht in ein Bild umgewandelt werden.');
  return blob;
}

function joinText(items) {
  let out = '';
  for (const item of items) {
    out += item.str;
    out += item.hasEOL ? '\n' : ' ';
  }
  return out
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function guessTitle(text, fileName, n) {
  const first = text.split('\n').find((l) => l.length > 2 && !/^\d+$/.test(l));
  if (first) return first.slice(0, 90);
  return `${fileName.replace(/\.pdf$/i, '')} – Seite ${n}`;
}

// Der Titel steht schon im Titelfeld, deshalb nicht doppelt in der Beschreibung
function stripTitle(text, title) {
  const lines = text.split('\n');
  const idx = lines.findIndex((l) => l.slice(0, 90) === title);
  if (idx !== -1 && idx < 3) lines.splice(idx, 1);
  return lines.join('\n');
}
