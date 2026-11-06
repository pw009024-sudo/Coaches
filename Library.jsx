import { useMemo, useState } from 'react';
import { AGE_GROUPS, GOALS, METHODS } from './config';
import { useSignedUrls } from './useSignedUrls';
import TagPicker from './TagPicker';
import ExerciseModal from './ExerciseModal';

const matches = (selected, values) => selected.length === 0 || selected.some((s) => values.includes(s));

export default function Library({ exercises, userId, onChanged, onAdd, onGoUpload }) {
  const [q, setQ] = useState('');
  const [age, setAge] = useState([]);
  const [goal, setGoal] = useState([]);
  const [method, setMethod] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        matches(age, e.age_groups) &&
        matches(goal, e.goals) &&
        matches(method, e.methods) &&
        (!needle ||
          e.title.toLowerCase().includes(needle) ||
          e.description.toLowerCase().includes(needle) ||
          (e.source_name || '').toLowerCase().includes(needle))
    );
  }, [exercises, q, age, goal, method]);

  const urls = useSignedUrls(filtered.map((e) => e.image_path));
  const open = exercises.find((e) => e.id === openId);
  const activeFilters = age.length + goal.length + method.length;

  if (exercises.length === 0) {
    return (
      <div className="empty">
        <h2>Noch keine Übungen</h2>
        <p>Lade eine PDF hoch, jede Seite wird zu einer Übung mit Bild.</p>
        <button className="btn primary" onClick={onGoUpload}>PDF hochladen</button>
      </div>
    );
  }

  return (
    <section>
      <div className="searchbar">
        <input
          type="search"
          placeholder="Übungen durchsuchen, z. B. „Kreuzen“ oder „Gegenstoß“"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Übungen durchsuchen"
        />
        <button className="btn" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}>
          Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
        </button>
      </div>

      {showFilters && (
        <div className="panel filters">
          <TagPicker label="Altersklasse" options={AGE_GROUPS} value={age} onChange={setAge} />
          <TagPicker label="Ziel" options={GOALS} value={goal} onChange={setGoal} />
          <TagPicker label="Methode" options={METHODS} value={method} onChange={setMethod} />
          {activeFilters > 0 && (
            <button className="link-btn" onClick={() => { setAge([]); setGoal([]); setMethod([]); }}>
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      <p className="muted count">{filtered.length} von {exercises.length} Übungen</p>

      {filtered.length === 0 ? (
        <p className="empty-inline">Keine Übung passt zu Suche und Filtern. Entferne einen Filter, um mehr zu sehen.</p>
      ) : (
        <ul className="grid">
          {filtered.map((e) => (
            <li key={e.id}>
              <button className="ex-card" onClick={() => setOpenId(e.id)}>
                <div className="thumb">
                  {urls[e.image_path] ? <img src={urls[e.image_path]} alt="" loading="lazy" /> : <span className="thumb-wait" />}
                </div>
                <span className="ex-title">{e.title}</span>
                <span className="ex-meta">
                  {[e.age_groups[0], e.goals[0], e.duration_min && `${e.duration_min} Min.`].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <ExerciseModal
          exercise={open}
          imageUrl={urls[open.image_path]}
          canDelete={open.created_by === userId}
          onClose={() => setOpenId(null)}
          onChanged={onChanged}
          onAdd={onAdd}
        />
      )}
    </section>
  );
}
