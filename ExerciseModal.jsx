import { useEffect, useRef, useState } from 'react';
import { api, isMine, isShared, canDelete } from './client.js';
import { PHASES } from './config';
import { prepareImage } from './images';
import ExerciseFields, { toPayload } from './ExerciseFields';
import ImagePicker from './ImagePicker';

const toForm = (e) => ({
  title: e.title || '',
  description: e.description || '',
  areas: e.areas || [],
  positions: e.positions || [],
  age_groups: e.age_groups || [],
  goals: e.goals || [],
  methods: e.methods || [],
  min_players: e.min_players ?? '',
  duration_min: e.duration_min ?? '',
});

export default function ExerciseModal({ exercise, imageUrl, onClose, onChanged, onAdd }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => toForm(exercise));
  const [newImage, setNewImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    const d = dialogRef.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  useEffect(() => setForm(toForm(exercise)), [exercise]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const cancelEdit = () => {
    setForm(toForm(exercise));
    setNewImage(null);
    setRemoveImage(false);
    setEditing(false);
    setError('');
  };

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

  const chooseImage = async (file) => {
    setError('');
    try {
      setNewImage(await prepareImage(file));
      setRemoveImage(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const save = async () => {
    if (!form.title.trim()) return setError('Bitte gib der Übung einen Namen.');
    if (form.areas.includes('Positionstraining') && form.positions.length === 0) {
      return setError('Wähle beim Positionstraining mindestens eine Position aus.');
    }
    setBusy(true);
    setError('');
    try {
      const body = toPayload(form);
      if (newImage) {
        await api(`images/${exercise.id}`, { method: 'PUT', image: newImage });
        body.has_image = true;
        body.image_version = Date.now();
      } else if (removeImage) {
        await api(`images/${exercise.id}`, { method: 'DELETE' });
        body.has_image = false;
      }
      await api(`exercises/${exercise.id}`, { method: 'PUT', body });
    } catch (e) {
      setBusy(false);
      return setError('Speichern fehlgeschlagen: ' + e.message);
    }
    setBusy(false);
    setNewImage(null);
    setRemoveImage(false);
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

  const list = (v) => (v || []).join(', ');

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose} onClick={(e) => e.target === dialogRef.current && onClose()}>
      <div className={imageUrl || editing ? 'modal-body' : 'modal-body no-image'}>
        {editing ? (
          <div className="modal-image modal-image-edit">
            <ImagePicker
              file={newImage}
              currentUrl={removeImage ? '' : imageUrl}
              onChange={chooseImage}
              onRemove={() => { setNewImage(null); setRemoveImage(true); }}
            />
          </div>
        ) : (
          imageUrl && (
            <div className="modal-image">
              <img src={imageUrl} alt={`Grafik: ${exercise.title}`} />
            </div>
          )
        )}

        <div className="modal-side">
          <button className="close" onClick={onClose} aria-label="Schließen">×</button>

          {!editing ? (
            <>
              <h2>{exercise.title}</h2>
              <dl className="facts">
                {exercise.areas?.length > 0 && (<><dt>Bereich</dt><dd>{list(exercise.areas)}</dd></>)}
                {exercise.positions?.length > 0 && (<><dt>Positionen</dt><dd>{list(exercise.positions)}</dd></>)}
                {exercise.min_players && (<><dt>Spieler</dt><dd>mindestens {exercise.min_players}</dd></>)}
                {exercise.duration_min && (<><dt>Dauer</dt><dd>{exercise.duration_min} Minuten</dd></>)}
                {exercise.age_groups?.length > 0 && (<><dt>Altersklasse</dt><dd>{list(exercise.age_groups)}</dd></>)}
                {exercise.goals?.length > 0 && (<><dt>Schwerpunkt</dt><dd>{list(exercise.goals)}</dd></>)}
                {exercise.methods?.length > 0 && (<><dt>Methode</dt><dd>{list(exercise.methods)}</dd></>)}
                {exercise.created_by && (<><dt>Angelegt von</dt><dd>{exercise.created_by}</dd></>)}
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
              <h2>Übung bearbeiten</h2>
              <ExerciseFields form={form} set={set} />
              <div className="row">
                <button className="btn ghost" onClick={cancelEdit}>Abbrechen</button>
                <button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Wird gespeichert …' : 'Änderungen speichern'}</button>
              </div>
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </dialog>
  );
}
