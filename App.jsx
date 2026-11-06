import { useCallback, useEffect, useState } from 'react';
import { api, getToken, getName, logout } from './api';
import { emptyDraft } from './config';
import Login from './Login';
import Library from './Library';
import Upload from './Upload';
import Planner from './Planner';
import TrainingList from './TrainingList';
import CourtMark from './CourtMark';

const TABS = [
  { id: 'library', label: 'Übungen' },
  { id: 'upload', label: 'PDF hochladen' },
  { id: 'planner', label: 'Training planen' },
  { id: 'trainings', label: 'Gespeicherte Trainings' },
];

export default function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));
  const [tab, setTab] = useState('library');
  const [exercises, setExercises] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    const onLogout = () => setLoggedIn(false);
    window.addEventListener('coaches-logout', onLogout);
    return () => window.removeEventListener('coaches-logout', onLogout);
  }, []);

  const loadExercises = useCallback(async () => {
    try {
      setExercises(await api('exercises'));
      setLoadError('');
    } catch (e) {
      setLoadError('Übungen konnten nicht geladen werden: ' + e.message);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) loadExercises();
  }, [loggedIn, loadExercises]);

  const addToDraft = (exercise, phase) => {
    setDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b) =>
        b.phase === phase
          ? { ...b, items: [...b.items, { exerciseId: exercise.id, minutes: exercise.duration_min || 10, note: '' }] }
          : b
      ),
    }));
  };

  const draftCount = draft.blocks.reduce((n, b) => n + b.items.length, 0);

  if (!loggedIn) return <Login onLoggedIn={() => setLoggedIn(true)} />;

  return (
    <div className="app">
      <header className="topbar no-print">
        <CourtMark />
        <div className="topbar-inner">
          <h1 className="brand"><img src="/icon.svg" alt="" className="brand-icon" />Coaches</h1>
          <div className="account">
            <span>{getName()}</span>
            <button className="link-btn" onClick={logout}>Abmelden</button>
          </div>
        </div>
        <nav className="tabs" aria-label="Bereiche">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'tab active' : 'tab'}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'planner' && draftCount > 0 && <span className="badge">{draftCount}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {loadError && <p className="error no-print">{loadError}</p>}
        {tab === 'library' && (
          <Library exercises={exercises} onChanged={loadExercises} onAdd={addToDraft} onGoUpload={() => setTab('upload')} />
        )}
        {tab === 'upload' && (
          <Upload onSaved={async () => { await loadExercises(); setTab('library'); }} />
        )}
        {tab === 'planner' && (
          <Planner draft={draft} setDraft={setDraft} exercises={exercises} onGoLibrary={() => setTab('library')} />
        )}
        {tab === 'trainings' && (
          <TrainingList
            onOpen={(t) => {
              setDraft({
                id: t.id,
                title: t.title,
                age_group: t.age_group || '',
                training_date: t.training_date || '',
                notes: t.notes || '',
                blocks: t.blocks,
              });
              setTab('planner');
            }}
          />
        )}
      </main>
    </div>
  );
}
