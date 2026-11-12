// Bereitet ein hochgeladenes Bild vor: sehr große Bilder werden verkleinert,
// damit sie schnell laden und unter der Größengrenze des Servers bleiben.
const MAX_SIDE = 2000; // Pixel
const MAX_BYTES = 4_500_000;

export const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

export async function prepareImage(file) {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error('Bitte eine PNG-Datei wählen (JPG und WebP gehen auch).');
  }
  const img = await load(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && file.size <= MAX_BYTES) return file;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (file.type !== 'image/png') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const toBlob = (type, q) => new Promise((r) => canvas.toBlob(r, type, q));

  // PNG bleibt PNG (scharfe Linien in Skizzen), nur wenn es dann noch zu groß ist, JPEG
  let blob = await toBlob(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
  if (!blob || blob.size > MAX_BYTES) {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    blob = await toBlob('image/jpeg', 0.85);
  }
  canvas.width = canvas.height = 0;
  if (!blob || blob.size > MAX_BYTES) throw new Error('Das Bild ist zu groß. Bitte ein kleineres Bild wählen.');
  return blob;
}

function load(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Das Bild konnte nicht geöffnet werden.')); };
    img.src = url;
  });
}
