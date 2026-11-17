import { useEffect, useRef, useState } from 'react';
import { api } from './client.js';
import { prepareImage } from './images';
import { parseImport, imageBlob, importPayload } from './importFile';
import VisibilityToggle from './VisibilityToggle';

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// Viele Übungen auf einmal aus einer Importdatei übernehmen
export default function ImportExercises({ onSaved }) {
  const [items, setItems] = useState([]);
  const [existing, setExisting] = useState(new Set());
  const [shared, setShared] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  // Vorhandene Übungen laden, um Doppelte zu erkennen
  useEffect(() => {
    api('exercises')
      .then((list) => setExisting(new Set(list.map((e) => norm(e.title)))))
      .catch(() => {});
  }, []);

  const readFile = async (file) => {
    setError('');
    setDone('');
    if (!file) return;
    try {
      const parsed = parseImport(await file.text());
      setItems(
        parsed.map((it) => {
          const duplicate = existing.has(norm(it.title));
          return { ...it, duplicate, include: Boolean(it.title) && !duplicate };
        })
      );
    } catch (e) {
      setItems([]);
      setError(e.message);
    }
  };

  const toggle = (key, include) => setItems((list) => list.map((i) => (i.key === key ? { ...i, include } : i)));
  const setAll = (include) => setItems((list) => list.map((i) => ({ ...i, include: include && Boolean(i.title) })));
  const selected = items.filter((i) => i.include);

  const save = async () => {
    setBusy(true);
    setError('');
    let count = 0;
    const failed = [];
    for (const it of selected) {
      setStatus(`Übung ${count + failed.length + 1} von ${selected.length} wird gespeichert …`);
      try {
        const id = crypto.randomUUID();
        let hasImage = false;
        if (it.imageData) {
          const image = await prepareImage(await imageBlob(it.imageData));
          await api(`images/${id}`, { method: 'PUT', image });
          hasImage = true;
        }
        await api('exercises', { method: 'POST', body: { id, ...importPayload(it), has_image: hasImage, shared } });
        count++;
        setItems((list) => list.filter((x) => x.key !== it.key));
      } catch (e) {
        failed.push(`${it.title}: ${e.message}`);
      }
    }
    setStatus('');
    setBusy(false);
    if (count) setDone(`${count} ${count === 1 ? 'Übung wurde' : 'Übungen wurden'} importiert.`);
    if (failed.length) setError(`Nicht gespeichert: ${failed.join(' · ')}`);
    if (count) onSaved?.();
  };

  const list = (v) => (v || []).join(', ');

  return (
    <section>
      <div
        className={dragging ? 'dropzone dragging' : 'dropzone'}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files?.[0]); }}
      >
        <strong>Importdatei wählen</strong>
        <span>Die .json-Datei mit deinen Übungen hier antippen oder hineinziehen.</span>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>

      {status && <p className="status" role="status">{status}</p>}
      {error && <p className="error">{error}</p>}
      {done && <p className="ok" role="status">{done} Du findest sie unter „Übungen“.</p>}

      {items.length > 0 && (
        <>
          <div className="panel">
            <VisibilityToggle label="Importierte Übungen sind sichtbar für" shared={shared} onChange={setShared} />
          </div>

          <div className="savebar">
            <span>{selected.length} von {items.length} Übungen ausgewählt</span>
            <div className="row wrap">
              <button className="btn ghost" onClick={() => setAll(true)} disabled={busy}>Alle</button>
              <button className="btn ghost" onClick={() => setAll(false)} disabled={busy}>Keine</button>
              <button className="btn primary" onClick={save} disabled={busy || selected.length === 0}>
                {busy ? 'Wird importiert …' : `${selected.length} Übungen importieren`}
              </button>
            </div>
          </div>

          <ul className="page-list">
            {items.map((it) => (
              <li key={it.key} className={it.include ? 'page-card' : 'page-card excluded'}>
                {it.imageData ? (
                  <img src={it.imageData} alt={`Grafik: ${it.title}`} />
                ) : (
                  <div className="muted small" style={{ padding: '1rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-s)' }}>
                    Keine Grafik
                  </div>
                )}
                <div className="page-fields">
                  <label className="check">
                    <input type="checkbox" checked={it.include} disabled={!it.title} onChange={(e) => toggle(it.key, e.target.checked)} />
                    <strong>{it.title || 'Ohne Namen'}</strong>
                  </label>
                  {it.duplicate && <p className="error small">Eine Übung mit diesem Namen gibt es schon. Sie ist deshalb abgewählt.</p>}
                  <p className="muted small">
                    {[
                      it.duration_min && `${it.duration_min} Min.`,
                      it.min_players && `ab ${it.min_players} Spielern`,
                      list(it.areas),
                      list(it.positions),
                      list(it.age_groups),
                      list(it.goals),
                      list(it.methods),
                    ].filter(Boolean).join(' · ')}
                  </p>
                  {[['Aufbau', it.setup], ['Material', it.material], ['Ablauf', it.procedure], ['Erweiterungen', it.extensions]]
                    .filter(([, t]) => t)
                    .map(([label, t]) => (
                      <p key={label} className="small" style={{ whiteSpace: 'pre-line' }}><strong>{label}:</strong> {t}</p>
                    ))}
                  {it.warnings.length > 0 && (
                    <ul className="muted small" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {it.warnings.map((w) => <li key={w}>{w}</li>)}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
