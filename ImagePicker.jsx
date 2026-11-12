import { useEffect, useRef, useState } from 'react';
import { ACCEPTED } from './images';

// Bildfeld: antippen oder Datei hineinziehen, mit Vorschau
export default function ImagePicker({ file, currentUrl, onChange, onRemove }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || currentUrl;
  const pick = () => inputRef.current?.click();

  return (
    <div className="image-picker">
      <div
        className={dragging ? 'image-drop dragging' : 'image-drop'}
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onChange(f);
        }}
      >
        {shown ? (
          <img src={shown} alt="Vorschau der Grafik" />
        ) : (
          <>
            <strong>Grafik hinzufügen</strong>
            <span>PNG-Datei hier antippen oder hineinziehen</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',') + ',.png'}
          hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); e.target.value = ''; }}
        />
      </div>
      {shown && (
        <div className="row wrap">
          <button type="button" className="btn ghost" onClick={pick}>Anderes Bild wählen</button>
          <button type="button" className="btn ghost" onClick={onRemove}>Bild entfernen</button>
        </div>
      )}
    </div>
  );
}
