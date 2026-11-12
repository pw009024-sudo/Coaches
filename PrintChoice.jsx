import { useEffect, useRef } from 'react';

// Auswahl vor dem Drucken: mit oder ohne Grafiken
export default function PrintChoice({ onChoose, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  return (
    <dialog ref={ref} className="modal print-choice" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="print-choice-body">
        <h2>Training als PDF</h2>
        <p className="muted">A4 hochkant, 3 Übungen pro Seite. Wie soll die PDF aussehen?</p>
        <div className="print-options">
          <button className="print-option" onClick={() => onChoose(true)}>
            <svg viewBox="0 0 48 36" aria-hidden="true">
              <rect x="2" y="4" width="18" height="12" rx="2" />
              <path d="M24 6h22M24 11h16" />
              <rect x="2" y="20" width="18" height="12" rx="2" />
              <path d="M24 22h22M24 27h16" />
            </svg>
            <strong>Mit Grafiken</strong>
            <span>Grafik links (⅓), Text rechts (⅔)</span>
          </button>
          <button className="print-option" onClick={() => onChoose(false)}>
            <svg viewBox="0 0 48 36" aria-hidden="true">
              <path d="M2 6h44M2 11h34M2 22h44M2 27h34" />
            </svg>
            <strong>Ohne Grafiken</strong>
            <span>Nur Text über die volle Breite</span>
          </button>
        </div>
        <button className="btn ghost" onClick={onClose}>Abbrechen</button>
      </div>
    </dialog>
  );
}
