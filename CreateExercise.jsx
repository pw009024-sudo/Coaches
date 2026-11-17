import { useState } from 'react';
import { api } from './client.js';
import { prepareImage, titleFromFileName } from './images';
import ExerciseFields, { toPayload, emptyExercise } from './ExerciseFields';
import ImagePicker from './ImagePicker';
import VisibilityToggle from './VisibilityToggle';
import ImportExercises from './ImportExercises';

// Reiter „Übung anlegen“: einzeln per Formular oder viele auf einmal per Importdatei
export default function CreateExercise({ onSaved }) {
  const [mode, setMode] = useState('single');
  return (
    <>
      <div className="segmented" role="group" aria-label="Art des Anlegens" style={{ marginBottom: '1rem' }}>
        <button type="button" aria-pressed={mode === 'single'} className={mode === 'single' ? 'on' : ''} onClick={() => setMode('single')}>
          Einzeln anlegen
        </button>
        <button type="button" aria-pressed={mode === 'import'} className={mode === 'import' ? 'on' : ''} onClick={() => setMode('import')}>
          Übungen importieren
        </button>
      </div>
      {mode === 'single' ? <SingleExercise onSaved={onSaved} /> : <ImportExercises onSaved={onSaved} />}
    </>
  );
}

function SingleExercise({ onSaved }) {
  const [form, setForm] = useState(emptyExercise);
  const [image, setImage] = useState(null);
  const [shared, setShared] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  // Merkt sich, ob der Name automatisch aus dem Dateinamen stammt (dann darf ein neues Bild ihn ersetzen)
  const [autoTitle, setAutoTitle] = useState(false);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    if ('title' in patch) setAutoTitle(false); // selbst geändert: nicht mehr automatisch überschreiben
    setDone('');
  };

  const chooseImage = async (file) => {
    setError('');
    try {
      setImage(await prepareImage(file));
      const fromFile = titleFromFileName(file.name);
      if (fromFile && (!form.title.trim() || autoTitle)) {
        setForm((f) => ({ ...f, title: fromFile }));
        setAutoTitle(true);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const reset = () => {
    setForm(emptyExercise());
    setImage(null);
    setAutoTitle(false);
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
      reset();
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
        <button type="button" className="btn ghost" onClick={() => { reset(); setError(''); setDone(''); }}>
          Formular leeren
        </button>
      </div>
    </form>
  );
}
