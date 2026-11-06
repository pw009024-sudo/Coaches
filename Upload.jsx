import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { processPdf } from '../lib/pdf';
import { AGE_GROUPS, GOALS, METHODS, BUCKET } from '../config';
import TagPicker from './TagPicker';

const emptyTags = { age_groups: [], goals: [], methods: [] };

export default function Upload({ onSaved }) {
  const [pages, setPages] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [batch, setBatch] = useState(emptyTags);
  const inputRef = useRef(null);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  // Vorschaubilder beim Verlassen der Seite freigeben
  useEffect(() => () => pagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  const handleFiles = async (fileList) => {
    const files = [...fileList].filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    if (files.length === 0) {
      setError('Bitte nur PDF-Dateien ablegen.');
      return;
    }
    setError('');
    for (const file of files) {
      try {
        const result = await processPdf(file, (n, total) =>
          setStatus(`${file.name}: Seite ${n} von ${total} wird gelesen …`)
        );
        setPages((prev) => [
          ...prev,
          ...result.map((p) => ({
            ...p,
            key: crypto.randomUUID(),
            sourceName: file.name,
            include: true,
            duration_min: '',
            ...emptyTags,
          })),
        ]);
      } catch (e) {
        setError(`${file.name} konnte nicht gelesen werden: ${e.message}`);
      }
    }
    setStatus('');
  };

  const update = (key, patch) =>
    setPages((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const applyBatch = () =>
    setPages((prev) =>
      prev.map((p) =>
        p.include
          ? {
              ...p,
              age_groups: [...new Set([...p.age_groups, ...batch.age_groups])],
              goals: [...new Set([...p.goals, ...batch.goals])],
              methods: [...new Set([...p.methods, ...batch.methods])],
            }
          : p
      )
    );

  const clearAll = () => {
    pages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPages([]);
  };

  const selected = pages.filter((p) => p.include);

  const save = async () => {
    setSaving(true);
    setError('');
    let done = 0;
    try {
      const rows = [];
      for (const p of selected) {
        setStatus(`Bild ${++done} von ${selected.length} wird hochgeladen …`);
        const path = `${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, p.blob, { contentType: 'image/webp' });
        if (upErr) throw upErr;
        rows.push({
          title: p.title.trim() || `Seite ${p.pageNumber}`,
          description: p.text,
          image_path: path,
          age_groups: p.age_groups,
          goals: p.goals,
          methods: p.methods,
          duration_min: p.duration_min ? Number(p.duration_min) : null,
          source_name: p.sourceName,
          page_number: p.pageNumber,
        });
      }
      setStatus('Übungen werden gespeichert …');
      const { error: dbErr } = await supabase.from('exercises').insert(rows);
      if (dbErr) throw dbErr;
      clearAll();
      setStatus('');
      onSaved?.();
    } catch (e) {
      setError('Speichern fehlgeschlagen: ' + e.message);
      setStatus('');
    }
    setSaving(false);
  };

  return (
    <section className="upload">
      <div
        className={dragging ? 'dropzone dragging' : 'dropzone'}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        <strong>PDF hier ablegen</strong>
        <span>oder klicken, um Dateien auszuwählen. Jede Seite wird zu einer Übung.</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          hidden
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {status && <p className="status" role="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      {pages.length > 0 && (
        <>
          <div className="batch panel">
            <h2>Kategorien für alle ausgewählten Seiten</h2>
            <p className="muted">Wähle hier, was für alle Seiten gilt, und übernimm es mit einem Klick. Einzelne Seiten kannst du danach noch anpassen.</p>
            <TagPicker label="Altersklasse" options={AGE_GROUPS} value={batch.age_groups} onChange={(v) => setBatch({ ...batch, age_groups: v })} />
            <TagPicker label="Ziel" options={GOALS} value={batch.goals} onChange={(v) => setBatch({ ...batch, goals: v })} />
            <TagPicker label="Methode" options={METHODS} value={batch.methods} onChange={(v) => setBatch({ ...batch, methods: v })} />
            <button className="btn" onClick={applyBatch}>Auf ausgewählte Seiten übernehmen</button>
          </div>

          <div className="savebar">
            <span>{selected.length} von {pages.length} Seiten ausgewählt</span>
            <div className="row">
              <button className="btn ghost" onClick={clearAll} disabled={saving}>Alle verwerfen</button>
              <button className="btn primary" onClick={save} disabled={saving || selected.length === 0}>
                {saving ? 'Wird gespeichert …' : `${selected.length} Übungen speichern`}
              </button>
            </div>
          </div>

          <ul className="page-list">
            {pages.map((p) => (
              <li key={p.key} className={p.include ? 'page-card' : 'page-card excluded'}>
                <img src={p.previewUrl} alt={`Seite ${p.pageNumber} aus ${p.sourceName}`} />
                <div className="page-fields">
                  <label className="check">
                    <input type="checkbox" checked={p.include} onChange={(e) => update(p.key, { include: e.target.checked })} />
                    Seite {p.pageNumber} aus {p.sourceName} übernehmen
                  </label>
                  <label>
                    Titel
                    <input value={p.title} onChange={(e) => update(p.key, { title: e.target.value })} />
                  </label>
                  <label className="narrow">
                    Dauer in Minuten
                    <input type="number" min="1" max="180" value={p.duration_min} onChange={(e) => update(p.key, { duration_min: e.target.value })} />
                  </label>
                  <TagPicker compact label="Altersklasse" options={AGE_GROUPS} value={p.age_groups} onChange={(v) => update(p.key, { age_groups: v })} />
                  <TagPicker compact label="Ziel" options={GOALS} value={p.goals} onChange={(v) => update(p.key, { goals: v })} />
                  <TagPicker compact label="Methode" options={METHODS} value={p.methods} onChange={(v) => update(p.key, { methods: v })} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
