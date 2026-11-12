// Erstellt eine Trainingseinheit als PDF-Datei nach festen Regeln:
// A4 hochkant, 2 cm Rand, 3 Übungen pro Seite, Bild zu Text = 1 : 2,
// Kopfzeile mit Datum, Fußzeile mit Seitenzahl. Jede Phase beginnt auf einer neuen Seite.
import { exerciseSections } from './config';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20; // 2 cm
const CONTENT_W = PAGE_W - 2 * MARGIN; // 170 mm
const GAP = 6; // Abstand zwischen Bild und Text
const IMG_W = (CONTENT_W - GAP) / 3; // 1 Teil Bild …
const TEXT_W = IMG_W * 2; // … 2 Teile Text
const PER_PAGE = 3;
const PT = 0.3528; // 1 pt in mm
const LINE = 1.25; // Zeilenabstand

const INK = [24, 33, 47];
const MUTED = [93, 104, 120];
const NAVY = [22, 58, 125];
const RULE = [200, 206, 216];

export async function createTrainingPdf({ draft, byId, withImages, imageUrlOf }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.setLineHeightFactor(LINE);

  const total = draft.blocks.flatMap((b) => b.items).reduce((s, i) => s + (Number(i.minutes) || 0), 0);
  const dateText = formatDate(draft.training_date);

  // Seiten aufteilen: je Phase neue Seite, je Seite 3 Übungen
  const pages = [];
  draft.blocks.filter((b) => b.items.length).forEach((b) => {
    const minutes = b.items.reduce((s, i) => s + (Number(i.minutes) || 0), 0);
    for (let i = 0; i < b.items.length; i += PER_PAGE) {
      pages.push({ phase: b.phase, minutes, part: i / PER_PAGE + 1, items: b.items.slice(i, i + PER_PAGE) });
    }
  });
  if (pages.length === 0) throw new Error('Das Training enthält noch keine Übungen.');

  // Bilder vorab laden
  const images = new Map();
  if (withImages) {
    const ids = [...new Set(pages.flatMap((p) => p.items.map((i) => i.exerciseId)))];
    await Promise.all(ids.map(async (id) => {
      const url = imageUrlOf(byId[id]);
      if (!url) return;
      const img = await loadForPdf(url).catch(() => null);
      if (img) images.set(id, img);
    }));
  }

  pages.forEach((pg, pi) => {
    if (pi > 0) doc.addPage();
    let y = MARGIN;

    // Überschrift der Seite: Phase links, Training rechts
    doc.setFont('helvetica', 'bold').setFontSize(15).setTextColor(...INK);
    const phaseLabel = clean(pg.phase);
    doc.text(phaseLabel, MARGIN, y, { baseline: 'top' });
    if (pg.part > 1) {
      const w = doc.getTextWidth(phaseLabel);
      doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...MUTED);
      doc.text(' (Fortsetzung)', MARGIN + w, y + 1.6, { baseline: 'top' });
    }
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK);
    doc.text(clean(draft.title || 'Training'), PAGE_W - MARGIN, y, { baseline: 'top', align: 'right' });
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED);
    doc.text(
      clean([draft.age_group, `${pg.phase} ${pg.minutes} Min.`, `gesamt ${total} Min.`].filter(Boolean).join('  ·  ')),
      PAGE_W - MARGIN, y + 4.2, { baseline: 'top', align: 'right' }
    );
    y += 9;
    doc.setDrawColor(...NAVY).setLineWidth(0.6).line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 3;

    // Notizen nur auf der ersten Seite, höchstens 2 Zeilen
    if (pi === 0 && draft.notes?.trim()) {
      doc.setFont('helvetica', 'italic').setFontSize(8.5).setTextColor(...MUTED);
      const lines = fit(doc, doc.splitTextToSize(clean(draft.notes.trim()), CONTENT_W), 2);
      doc.text(lines, MARGIN, y, { baseline: 'top' });
      y += lines.length * 8.5 * PT * LINE + 2;
    }

    // Drei gleich große Plätze
    const slotH = (PAGE_H - MARGIN - y) / PER_PAGE;
    pg.items.forEach((it, i) => {
      const top = y + i * slotH;
      drawExercise(doc, byId[it.exerciseId], it, images.get(it.exerciseId), withImages, top, slotH);
      if (i < PER_PAGE - 1 && i < pg.items.length - 1) {
        doc.setDrawColor(...RULE).setLineWidth(0.3).line(MARGIN, top + slotH, PAGE_W - MARGIN, top + slotH);
      }
    });
  });

  // Kopfzeile (Datum) und Fußzeile (Seitenzahl) auf jeder Seite
  const count = doc.getNumberOfPages();
  for (let p = 1; p <= count; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED);
    doc.text(dateText, PAGE_W - MARGIN, MARGIN / 2, { baseline: 'middle', align: 'right' });
    doc.text(`Seite ${p} von ${count}`, PAGE_W / 2, PAGE_H - MARGIN / 2, { baseline: 'middle', align: 'center' });
  }

  doc.setProperties({ title: clean(draft.title || 'Training'), creator: 'Coaches' });
  const name = `${draft.title || 'Training'} ${draft.training_date || ''}`.trim().replace(/[\\/:*?"<>|]+/g, '-');
  doc.save(`${name}.pdf`);
}

function drawExercise(doc, ex, item, img, withImages, top, slotH) {
  const pad = 3;
  const useImage = withImages && img;
  const textX = useImage ? MARGIN + IMG_W + GAP : MARGIN;
  const textW = useImage ? TEXT_W : CONTENT_W;
  const bottom = top + slotH - pad;

  if (useImage) {
    const maxH = slotH - 2 * pad;
    const scale = Math.min(IMG_W / img.w, maxH / img.h);
    const w = img.w * scale;
    const h = img.h * scale;
    const x = MARGIN + (IMG_W - w) / 2;
    doc.addImage(img.data, 'JPEG', x, top + pad, w, h);
    doc.setDrawColor(...RULE).setLineWidth(0.2).rect(x, top + pad, w, h);
  }

  let y = top + pad;
  // Schreibt Zeilen, solange Platz ist; sonst wird mit „…“ abgeschnitten
  const write = (text, size, style, color, gapAfter = 1.2) => {
    if (y >= bottom) return false;
    doc.setFont('helvetica', style).setFontSize(size).setTextColor(...color);
    const lh = size * PT * LINE;
    const room = Math.floor((bottom - y) / lh);
    if (room < 1) { y = bottom; return false; }
    const all = doc.splitTextToSize(clean(text), textW);
    const lines = fit(doc, all, room);
    doc.text(lines, textX, y, { baseline: 'top' });
    y += lines.length * lh + gapAfter;
    return lines.length === all.length;
  };

  write(ex?.title || 'Übung wurde gelöscht', 11.5, 'bold', INK, 0.8);
  const facts = [`${item.minutes} Min.`, ex?.min_players && `ab ${ex.min_players} Spielern`, ex?.positions?.length && ex.positions.join(', ')]
    .filter(Boolean).join('  ·  ');
  write(facts, 8.5, 'bold', NAVY, 1.8);
  if (item.note?.trim()) write(`Hinweis: ${item.note.trim()}`, 9, 'italic', INK, 1.6);

  for (const sec of exerciseSections(ex)) {
    if (!write(sec.label, 8.5, 'bold', NAVY, 0.3)) break;
    if (!write(sec.text, 9, 'normal', INK, 1.6)) break;
  }
}

// Schneidet eine Zeilenliste auf max Zeilen und setzt „…“ ans Ende, wenn gekürzt
function fit(doc, lines, max) {
  if (lines.length <= max) return lines;
  const out = lines.slice(0, max);
  out[max - 1] = out[max - 1].replace(/\s*\S*$/, '') + ' …';
  return out;
}

// Bild laden, auf weißen Hintergrund setzen und als JPEG für die PDF vorbereiten
async function loadForPdf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Bild nicht gefunden');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = objectUrl;
    });
    const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', 0.9);
    const out = { data, w: canvas.width, h: canvas.height };
    canvas.width = canvas.height = 0;
    return out;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatDate(iso) {
  const d = iso ? new Date(`${iso}T12:00:00`) : new Date();
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Die Standardschrift der PDF kennt nur westeuropäische Zeichen (inkl. ä, ö, ü, ß, „ “ – …)
const EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function clean(text) {
  return String(text ?? '')
    .replace(/\r/g, '')
    .replace(/[→⇒➔]/g, '->')
    .replace(/[←⇐]/g, '<-')
    .split('')
    .map((c) => (c.charCodeAt(0) <= 255 || EXTRA.includes(c) ? c : ''))
    .join('');
}
