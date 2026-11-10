import { useEffect, useRef, useState } from 'react';
import { api, isMine, isShared, canDelete } from './client.js';
import { AREAS, AGE_GROUPS, GOALS, METHODS, PHASES } from './config';
import TagPicker from './TagPicker';

const withDefaults = (e) => ({ areas: [], min_players: null, ...e });

export default function ExerciseModal({ exercise, imageUrl, onClose, onChanged, onAdd }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(withDefaults(exercise));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    const d = dialogRef.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  useEffect(() => setForm(withDefaults(exercise)), [exercise]);

  const setVisibility = async (shared) => {
    setBusy(true);
    try {
      await api(`exercises/${exercise.id}`, { method: 'PUT', body: { shared } });
      onChanged();
    } catch (e) {
      setError('Ändern fehlgeschlagen: ' + e.message);
    }
    setBusy(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      await api(`exercises/${exercise.id}`, {
        method: 'PUT',
        body: {
          title: form.title,
          description: form.description,
          areas: form.areas,
          min_players: form.min_players ? Number(form.min_players) : null,
          age_groups: form.age_groups,
          goals: form.goals,
          methods: form.methods,
          duration_min: form.duration_min ? Number(form.duration_min) : null,
        },
      });
    } catch (e) {
      setBusy(false);
      return setError('Speichern fehlgeschlagen: ' + e.message);
    }
    setBusy(false);
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm(`„${exercise.title}“ endgültig löschen?`)) return;
    setBusy(true);
    try {
      await api(`exercises/${exercise.id}`, { method: 'DELETE' });
    } catch (e) {
      setBusy(false);
      return setError('Löschen fehlgeschlagen: ' + e.message);
    }
    onChanged();
    onClose();
  };

  const add = (phase) => {
    onAdd(exercise, phase);
    setAdded(phase);
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose} onClick={(e) => e.target === dialogRef.current && onClose()}>
      <div className="modal-body">
        <div className="modal-image">
          <img src={imageUrl} alt={`Übungsblatt: ${exercise.title}`} />
        </div>

        <div className="modal-side">
          <button className="close" onClick={onClose} aria-label="Schließen">×</button>

          {!editing ? (
            <>
              <h2>{exercise.title}</h2>
              <dl className="facts">
                {exercise.areas?.length > 0 && (<><dt>Bereich</dt><dd>{exercise.areas.join(', ')}</dd></>)}
                {exercise.min_players && (<><dt>Spieler</dt><dd>mindestens {exercise.min_players}</dd></>)}
                {exercise.duration_min && (<><dt>Dauer</dt><dd>{exercise.duration_min} Minuten</dd></>)}
                {exercise.age_groups.length > 0 && (<><dt>Altersklasse</dt><dd>{exercise.age_groups.join(', ')}</dd></>)}
                {exercise.goals.length > 0 && (<><dt>Schwerpunkt</dt><dd>{exercise.goals.join(', ')}</dd></>)}
                {exercise.methods.length > 0 && (<><dt>Methode</dt><dd>{exercise.methods.join(', ')}</dd></>)}
                {exercise.source_name && (<><dt>Quelle</dt><dd>{exercise.source_name}, Seite {exercise.page_number}</dd></>)}
                {exercise.created_by && (<><dt>Hochgeladen von</dt><dd>{exercise.created_by}</dd></>)}
                <dt>Sichtbar für</dt><dd>{isShared(exercise) ? 'Alle Trainer' : 'Nur mich (privat)'}</dd>
              </dl>

              {exercise.description && (
                <div className="ex-text">
                  <h3>Beschreibung</h3>
                  <p>{exercise.description}</p>
                </div>
              )}

              <div className="add-box">
                <h3>Zum Training hinzufügen</h3>
                <div className="row wrap">
                  {PHASES.map((p) => (
                    <button key={p} className="btn" onClick={() => add(p)}>{p}</button>
                  ))}
                </div>
                {added && <p className="ok" role="status">Im {added} des aktuellen Trainings eingefügt.</p>}
              </div>

              <div className="row wrap">
                <button className="btn ghost" onClick={() => setEditing(true)}>Bearbeiten</button>
                {(isMine(exercise) || !exercise.owner_id) && (
                  <button className="btn ghost" onClick={() => setVisibility(!isShared(exercise))} disabled={busy}>
                    {isShared(exercise) ? 'Privat machen' : 'Für alle freigeben'}
                  </button>
                )}
                {canDelete(exercise) && <button className="btn danger" onClick={remove} disabled={busy}>Löschen</button>}
              </div>
            </>
          ) : (
            <div className="stack">
              <label>Titel<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
              <label className="narrow">Mindestanzahl Spieler
                <input type="number" min="1" max="40" value={form.min_players ?? ''} onChange={(e) => setForm({ ...form, min_players: e.target.value })} />
              </label>
              <label className="narrow">Dauer in Minuten
                <input type="number" min="1" max="180" value={form.duration_min ?? ''} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} />
              </label>
              <TagPicker compact label="Bereich im Training" options={AREAS} value={form.areas} onChange={(v) => setForm({ ...form, areas: v })} />
              <TagPicker compact label="Altersklasse" options={AGE_GROUPS} value={form.age_groups} onChange={(v) => setForm({ ...form, age_groups: v })} />
              <TagPicker compact label="Schwerpunkt" options={GOALS} value={form.goals} onChange={(v) => setForm({ ...form, goals: v })} />
              <TagPicker compact label="Methode" options={METHODS} value={form.methods} onChange={(v) => setForm({ ...form, methods: v })} />
              <label>Beschreibung
                <textarea rows="10" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <div className="row">
                <button className="btn ghost" onClick={() => { setForm(withDefaults(exercise)); setEditing(false); }}>Abbrechen</button>
                <button className="btn primary" onClick={save} disabled={busy}>Änderungen speichern</button>
              </div>
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </dialog>
  );
}
