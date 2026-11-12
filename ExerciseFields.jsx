import { AREAS, POSITIONS, AGE_GROUPS, GOALS, METHODS, SECTIONS } from './config';
import TagPicker from './TagPicker';

// Alle Eingabefelder einer Übung (beim Anlegen und beim Bearbeiten)
export default function ExerciseFields({ form, set }) {
  const isPositional = form.areas.includes('Positionstraining');

  return (
    <div className="stack">
      <label>
        Name der Übung *
        <input required value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Wird aus dem Dateinamen des Bildes übernommen" />
      </label>

      {SECTIONS.map((s) => (
        <label key={s.key}>
          {s.label}
          <textarea rows={s.rows} value={form[s.key]} placeholder={s.placeholder} onChange={(e) => set({ [s.key]: e.target.value })} />
        </label>
      ))}

      <div className="row wrap">
        <label className="narrow">
          Mindestanzahl Spieler
          <input type="number" min="1" max="40" value={form.min_players ?? ''} onChange={(e) => set({ min_players: e.target.value })} />
        </label>
        <label className="narrow">
          Dauer in Minuten
          <input type="number" min="1" max="180" value={form.duration_min ?? ''} onChange={(e) => set({ duration_min: e.target.value })} />
        </label>
      </div>

      <TagPicker label="Bereich im Training" options={AREAS} value={form.areas} onChange={(v) => set({ areas: v })} />

      {isPositional && (
        <div className="position-box">
          <TagPicker label="Für welche Positionen?" options={POSITIONS} value={form.positions} onChange={(v) => set({ positions: v })} />
        </div>
      )}

      <TagPicker label="Altersklasse" options={AGE_GROUPS} value={form.age_groups} onChange={(v) => set({ age_groups: v })} />
      <TagPicker label="Schwerpunkt" options={GOALS} value={form.goals} onChange={(v) => set({ goals: v })} />
      <TagPicker label="Methode" options={METHODS} value={form.methods} onChange={(v) => set({ methods: v })} />
    </div>
  );
}

// Formularwerte für den Server aufbereiten
export function toPayload(form) {
  const positional = form.areas.includes('Positionstraining');
  return {
    title: form.title.trim(),
    ...Object.fromEntries(SECTIONS.map((s) => [s.key, (form[s.key] || '').trim()])),
    ...Object.fromEntries(SECTIONS.map((s) => [s.key, ''])), // ersetzt durch die einzelnen Felder
    areas: form.areas,
    positions: positional ? form.positions : [],
    age_groups: form.age_groups,
    goals: form.goals,
    methods: form.methods,
    min_players: form.min_players ? Number(form.min_players) : null,
    duration_min: form.duration_min ? Number(form.duration_min) : null,
  };
}

export const emptyExercise = () => ({
  title: '',
  description: '',
  areas: [],
  positions: [],
  age_groups: [],
  goals: [],
  methods: [],
  min_players: '',
  duration_min: '',
});
