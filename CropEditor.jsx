import { useEffect, useRef, useState } from 'react';

// Ausschnitt der Grafik festlegen: mit Finger oder Maus ein Rechteck aufziehen
export default function CropEditor({ src, width, height, initial, onApply, onClose }) {
  const dialogRef = useRef(null);
  const imgRef = useRef(null);
  const [rect, setRect] = useState(initial || { x: 0, y: 0, w: width, h: height });
  const startRef = useRef(null);

  useEffect(() => {
    const d = dialogRef.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  const toImage = (e) => {
    const b = imgRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - b.left, 0), b.width) * (width / b.width);
    const y = Math.min(Math.max(e.clientY - b.top, 0), b.height) * (height / b.height);
    return { x, y };
  };

  const down = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = toImage(e);
    setRect({ ...startRef.current, w: 0, h: 0 });
  };
  const move = (e) => {
    if (!startRef.current) return;
    const p = toImage(e);
    const s = startRef.current;
    setRect({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  const up = () => { startRef.current = null; };

  const valid = rect.w > 40 && rect.h > 40;
  const pct = (v, total) => `${(v / total) * 100}%`;

  return (
    <dialog ref={dialogRef} className="modal crop-modal" onClose={onClose}>
      <div className="crop-body">
        <h2>Grafik auswählen</h2>
        <p className="muted small">Ziehe mit dem Finger oder der Maus ein Rechteck um die Grafik.</p>
        <div className="crop-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <img ref={imgRef} src={src} alt="Ganze PDF-Seite" draggable="false" />
          {rect.w > 0 && (
            <div
              className="crop-rect"
              style={{ left: pct(rect.x, width), top: pct(rect.y, height), width: pct(rect.w, width), height: pct(rect.h, height) }}
            />
          )}
        </div>
        <div className="row wrap">
          <button className="btn ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn" onClick={() => onApply(null)}>Ganze Seite verwenden</button>
          <button className="btn primary" disabled={!valid} onClick={() => onApply(rect)}>Ausschnitt übernehmen</button>
        </div>
      </div>
    </dialog>
  );
}
