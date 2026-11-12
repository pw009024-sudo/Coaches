import { useMemo, useState } from 'react';
import { AREAS, POSITIONS, AGE_GROUPS, GOALS, METHODS, exerciseSearchText } from './config';
import { imageUrl, isMine, isShared } from './client.js';
import TagPicker from './TagPicker';
import ExerciseModal from './ExerciseModal';
import { ExerciseList } from './ExerciseDropdown';

const matches = (selected, values = []) => selected.length === 0 || selected.some((s) => values.includes(s));

export default function Library({ exercises, onChanged, onAdd, onGoUpload }) {
  const [q, setQ] = useState('');
  const [area, setArea] = useState([]);
  const [position, setPosition] = useState([]);
  const [players, setPlayers] = useState('');
  const [age, setAge] = useState([]);
  const [goal, setGoal] = useState([]);
  const [method, setMethod] = useState([]);
  const [scope, setScope] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        (scope === 'all' || (scope === 'shared' ? isShared(e) : isMine(e))) &&
        matches(area, e.areas) &&
        matches(position, e.positions) &&
        (!players || !e.min_players || e.min_players <= Number(players)) &&
        matches(age, e.age_groups) &&
        matches(goal, e.goals) &&
        matches(method, e.methods) &&
        (!needle ||
          exerciseSearchText(e).includes(needle) ||
          (e.source_name || '').toLowerCase().includes(needle))
    );
  }, [exercises, q, area, position, players, age, goal, method, scope]);

  const open = exercises.find((e) => e.id === openId);
  const activeFilters = area.length + position.length + age.length + goal.length + method.length + (players ? 1 : 0);

  if (exercises.length === 0) {
    return (
      <div className="empty">
        <h2>Noch keine Übungen</h2>
        <p>Lege deine erste Übung an, mit Beschreibung und Grafik.</p>
        <button className="btn primary" onClick={onGoUpload}>Übung anlegen</button>
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

      <div className="segmented scope" role="group" aria-label="Bereich">
        <button aria-pressed={scope === 'all'} className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>Alle</button>
        <button aria-pressed={scope === 'shared'} className={scope === 'shared' ? 'on' : ''} onClick={() => setScope('shared')}>Gemeinsam</button>
        <button aria-pressed={scope === 'mine'} className={scope === 'mine' ? 'on' : ''} onClick={() => setScope('mine')}>Von mir</button>
      </div>

      {showFilters && (
        <div className="panel filters">
          <TagPicker label="Bereich im Training" options={AREAS} value={area} onChange={setArea} />
          <TagPicker label="Position (Positionstraining)" options={POSITIONS} value={position} onChange={setPosition} />
          <TagPicker label="Altersklasse" options={AGE_GROUPS} value={age} onChange={setAge} />
          <label className="narrow players-field">
            Spieler heute im Training
            <input type="number" min="1" max="40" value={players} placeholder="z. B. 8" onChange={(e) => setPlayers(e.target.value)} />
          </label>
          <TagPicker label="Schwerpunkt" options={GOALS} value={goal} onChange={setGoal} />
          <TagPicker label="Methode" options={METHODS} value={method} onChange={setMethod} />
          {activeFilters > 0 && (
            <button className="link-btn" onClick={() => { setArea([]); setPosition([]); setPlayers(''); setAge([]); setGoal([]); setMethod([]); }}>
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      <p className="muted count">
        {filtered.length === exercises.length
          ? `${exercises.length} Übungen`
          : `${filtered.length} von ${exercises.length} Übungen`}
      </p>

      <ExerciseList
        exercises={filtered}
        isPrivate={(e) => !isShared(e)}
        onOpen={(e) => setOpenId(e.id)}
        emptyText="Keine Übung passt zu Suche und Filtern. Entferne einen Filter, um mehr zu sehen."
      />

      {open && (
        <ExerciseModal
          exercise={open}
          imageUrl={imageUrl(open)}
          onClose={() => setOpenId(null)}
          onChanged={onChanged}
          onAdd={onAdd}
        />
      )}
    </section>
  );
}
