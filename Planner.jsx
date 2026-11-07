import { useMemo, useState } from 'react';
import { api, imageUrl, getUser, isShared } from './client.js';
import ExerciseDropdown from './ExerciseDropdown';
import VisibilityToggle from './VisibilityToggle';
import { AGE_GROUPS, PHASE_AREAS, emptyDraft } from './config';

// Plus-Knopf je Phase: öffnet das Dropdown mit Übungen, die zu Phase und Altersklasse passen
function PhasePicker({ phase, ageGroup, exercises, onPick }) {
  const [q, setQ] = useState('');
  const [onlyMatching, setOnlyMatching] = useState(true);

  const list = useMemo(() => {
    const areas = PHASE_AREAS[phase] || [];
    const needle = q.trim().toLowerCase();
    return exercises
      .filter((e) => {
        if (needle && !e.title.toLowerCase().includes(needle) && !(e.description || '').toLowerCase().includes(needle)) return false;
        if (!onlyMatching) return true;
        const exAreas = e.areas || [];
        const areaOk = exAreas.length === 0 || exAreas.some((a) => areas.includes(a));
        const ageOk = !ageGroup || (e.age_groups || []).length === 0 || e.age_groups.includes(ageGroup);
        return areaOk && ageOk;
      })
      .sort((a, b) => a.title.localeCompare(b.title, 'de'));
  }, [exercises, phase, ageGroup, q, onlyMatching]);

  return (
    <ExerciseDropdown
      exercises={list}
      badge={<svg className="plus-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>}
      ariaLabel={`Übung zu „${phase}“ hinzufügen`}
      isPrivate={(e) => !isShared(e)}
      onSelect={(e) => { onPick(e); setQ(''); }}
      emptyText={onlyMatching ? 'Keine passende Übung. Entferne den Haken, um alle zu sehen.' : 'Keine Übung gefunden.'}
      header={
        <>
          <input
            className="exdd-search"
            type="search"
            placeholder="Übung suchen"
            aria-label="Übung suchen"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <label className="exdd-check">
            <input type="checkbox" checked={onlyMatching} onChange={(e) => setOnlyMatching(e.target.checked)} />
            Nur passend zu {phase}{ageGroup ? ` und ${ageGroup}` : ''}
          </label>
        </>
      }
    />
  );
}


export default function Planner({ draft, setDraft, exercises }) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const byId = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const allItems = draft.blocks.flatMap((b) => b.items);
  const total = allItems.reduce((s, i) => s + (Number(i.minutes) || 0), 0);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const canChangeVisibility = !draft.id || !draft.owner_id || draft.owner_id === getUser()?.id;

  const updateItem = (bi, ii, patch) =>
    setDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b, i) =>
        i !== bi ? b : { ...b, items: b.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) }
      ),
    }));

  const moveItem = (bi, ii, dir) =>
    setDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b, i) => {
        if (i !== bi) return b;
        const items = [...b.items];
        const target = ii + dir;
        if (target < 0 || target >= items.length) return b;
        [items[ii], items[target]] = [items[target], items[ii]];
        return { ...b, items };
      }),
    }));

  const addItem = (bi, ex) =>
    setDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b, i) =>
        i !== bi ? b : { ...b, items: [...b.items, { exerciseId: ex.id, minutes: ex.duration_min || 10, note: '' }] }
      ),
    }));

  const removeItem = (bi, ii) =>
    setDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b, i) => (i !== bi ? b : { ...b, items: b.items.filter((_, j) => j !== ii) })),
    }));

  const save = async (asCopy = false) => {
    if (!draft.title.trim()) return setError('Gib dem Training einen Titel, damit du es später wiederfindest.');
    setBusy(true);
    setError('');
    const payload = {
      title: asCopy ? `${draft.title} (Kopie)` : draft.title.trim(),
      age_group: draft.age_group || null,
      training_date: draft.training_date || null,
      notes: draft.notes,
      blocks: draft.blocks,
      shared: asCopy ? false : draft.shared,
    };
    let data;
    try {
      data =
        draft.id && !asCopy
          ? await api(`trainings/${draft.id}`, { method: 'PUT', body: payload })
          : await api('trainings', { method: 'POST', body: payload });
    } catch (e) {
      setBusy(false);
      return setError('Speichern fehlgeschlagen: ' + e.message);
    }
    setBusy(false);
    setDraft((d) => ({ ...d, id: data.id, title: data.title, shared: data.shared !== false, owner_id: data.owner_id }));
    setStatus(asCopy ? 'Als neues Training gespeichert.' : 'Training gespeichert.');
    setTimeout(() => setStatus(''), 3000);
  };

  const reset = () => {
    if (allItems.length && !confirm('Aktuelle Planung leeren und neu beginnen?')) return;
    setDraft(emptyDraft());
  };

  return (
    <>
      <section className="planner no-print">
        <div className="panel plan-head">
          <label className="grow">
            Titel
            <input value={draft.title} placeholder="z. B. D-Jugend, Abwehr 1 gegen 1" onChange={(e) => set({ title: e.target.value })} />
          </label>
          <label>
            Datum
            <input type="date" value={draft.training_date} onChange={(e) => set({ training_date: e.target.value })} />
          </label>
          <label>
            Altersklasse
            <select value={draft.age_group} onChange={(e) => set({ age_group: e.target.value })}>
              <option value="">Keine Angabe</option>
              {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          {canChangeVisibility && (
            <div className="full">
              <VisibilityToggle label="Training sichtbar für" shared={draft.shared} onChange={(v) => set({ shared: v })} />
            </div>
          )}
          {!canChangeVisibility && (
            <p className="full muted small">Gemeinsames Training eines anderen Trainers. Änderungen sehen alle. Für eine eigene Version nutze „Als neues Training speichern“.</p>
          )}
          <label className="full">
            Notizen
            <textarea rows="2" value={draft.notes} placeholder="Schwerpunkt, Material, Hallenzeit …" onChange={(e) => set({ notes: e.target.value })} />
          </label>
        </div>

        <div className="clock" aria-live="polite">
          <span className="clock-num">{total}</span>
          <span>Minuten geplant</span>
        </div>

        {draft.blocks.map((block, bi) => {
          const sum = block.items.reduce((s, i) => s + (Number(i.minutes) || 0), 0);
          return (
            <div key={block.phase} className="phase">
              <div className="phase-head">
                <h2>{block.phase} <span className="muted">{sum} Min.</span></h2>
                <PhasePicker
                  phase={block.phase}
                  ageGroup={draft.age_group}
                  exercises={exercises}
                  onPick={(ex) => addItem(bi, ex)}
                />
              </div>
              {block.items.length === 0 ? (
                <p className="empty-inline">
                  Noch leer. Tippe auf das Plus, um eine Übung auszuwählen.
                </p>
              ) : (
                <ol className="plan-items">
                  {block.items.map((it, ii) => {
                    const ex = byId[it.exerciseId];
                    return (
                      <li key={ii} className="plan-item">
                        <div className="mini-thumb">
                          {ex && <img src={imageUrl(ex.id)} alt="" />}
                        </div>
                        <div className="plan-item-main">
                          <strong>{ex ? ex.title : 'Übung wurde gelöscht'}</strong>
                          <input
                            className="note"
                            placeholder="Hinweis für diese Einheit"
                            value={it.note}
                            onChange={(e) => updateItem(bi, ii, { note: e.target.value })}
                          />
                        </div>
                        <label className="minutes">
                          <input type="number" min="1" max="180" value={it.minutes} onChange={(e) => updateItem(bi, ii, { minutes: e.target.value })} />
                          Min.
                        </label>
                        <div className="item-actions">
                          <button className="icon-btn" onClick={() => moveItem(bi, ii, -1)} disabled={ii === 0} aria-label="Nach oben">↑</button>
                          <button className="icon-btn" onClick={() => moveItem(bi, ii, 1)} disabled={ii === block.items.length - 1} aria-label="Nach unten">↓</button>
                          <button className="icon-btn" onClick={() => removeItem(bi, ii)} aria-label="Entfernen">×</button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          );
        })}

        {error && <p className="error">{error}</p>}
        {status && <p className="ok" role="status">{status}</p>}

        <div className="row wrap actions">
          <button className="btn primary" onClick={() => save(false)} disabled={busy}>Training speichern</button>
          {draft.id && <button className="btn" onClick={() => save(true)} disabled={busy}>Als neues Training speichern</button>}
          <button className="btn" onClick={() => window.print()} disabled={allItems.length === 0}>Drucken</button>
          <button className="btn ghost" onClick={reset}>Neues Training</button>
        </div>
      </section>

      {/* Nur beim Drucken sichtbar */}
      <article className="print-sheet">
        <h1>{draft.title || 'Training'}</h1>
        <p>
          {[draft.training_date && new Date(draft.training_date).toLocaleDateString('de-DE'), draft.age_group, `${total} Minuten`]
            .filter(Boolean).join(', ')}
        </p>
        {draft.notes && <p className="print-notes">{draft.notes}</p>}
        {draft.blocks.filter((b) => b.items.length).map((b) => (
          <section key={b.phase}>
            <h2>{b.phase}</h2>
            {b.items.map((it, i) => {
              const ex = byId[it.exerciseId];
              return (
                <div key={i} className="print-item">
                  <h3>{ex?.title} ({[`${it.minutes} Min.`, ex?.min_players && `ab ${ex.min_players} Spielern`].filter(Boolean).join(', ')})</h3>
                  {it.note && <p>{it.note}</p>}
                  {ex && <img src={imageUrl(ex.id)} alt="" />}
                </div>
              );
            })}
          </section>
        ))}
      </article>
    </>
  );
}
