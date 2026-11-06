import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const TARGET_WIDTH = 1300; // Pixelbreite der gespeicherten Seitenbilder

// Liest eine PDF ein: jede Seite wird zu einem Bild plus ausgelesenem Text.
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
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
    const text = await extractText(page);

    pages.push({
      pageNumber: n,
      blob,
      previewUrl: URL.createObjectURL(blob),
      text,
      title: guessTitle(text, file.name, n),
    });
    page.cleanup();
  }
  await pdf.destroy();
  return pages;
}

async function extractText(page) {
  const content = await page.getTextContent();
  let out = '';
  for (const item of content.items) {
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
