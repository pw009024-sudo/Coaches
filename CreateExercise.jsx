import { useState } from 'react';
import { api } from './client.js';
import { prepareImage } from './images';
import ExerciseFields, { toPayload, emptyExercise } from './ExerciseFields';
import ImagePicker from './ImagePicker';
import VisibilityToggle from './VisibilityToggle';

export default function CreateExercise({ onSaved }) {
  const [form, setForm] = useState(emptyExercise);
  const [image, setImage] = useState(null);
  const [shared, setShared] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setDone(''); };

  const chooseImage = async (file) => {
    setError('');
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      setError(e.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Bitte gib der Übung einen Namen.');
    if (form.areas.includes('Positionstraining') && form.positions.length === 0) {
      return setError('Wähle beim Positionstraining mindestens eine Position aus.');
    }
    setBusy(true);
    setError('');
    try {
      const id = crypto.randomUUID();
      if (image) await api(`images/${id}`, { method: 'PUT', image });
      await api('exercises', {
        method: 'POST',
        body: { id, ...toPayload(form), has_image: Boolean(image), shared },
      });
      setDone(`„${form.title.trim()}“ wurde gespeichert.`);
      setForm(emptyExercise());
      setImage(null);
      onSaved?.();
    } catch (err) {
      setError('Speichern fehlgeschlagen: ' + err.message);
    }
    setBusy(false);
  };

  return (
    <form className="create" onSubmit={save}>
      <div className="create-grid">
        <section className="panel">
          <h2>Grafik</h2>
          <ImagePicker file={image} onChange={chooseImage} onRemove={() => setImage(null)} />
        </section>

        <section className="panel">
          <h2>Angaben zur Übung</h2>
          <ExerciseFields form={form} set={set} />
        </section>
      </div>

      <div className="panel">
        <VisibilityToggle label="Diese Übung ist sichtbar für" shared={shared} onChange={setShared} />
      </div>

      {error && <p className="error">{error}</p>}
      {done && <p className="ok" role="status">{done} Du kannst direkt die nächste Übung anlegen.</p>}

      <div className="row wrap">
        <button className="btn primary" disabled={busy}>{busy ? 'Wird gespeichert …' : 'Übung speichern'}</button>
        <button type="button" className="btn ghost" onClick={() => { setForm(emptyExercise()); setImage(null); setError(''); setDone(''); }}>
          Formular leeren
        </button>
      </div>
    </form>
  );
}
