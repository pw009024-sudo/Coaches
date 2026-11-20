import { useCallback, useEffect, useState } from 'react';
import { api, getToken, getName } from './client.js';
import { emptyDraft } from './config';
import Login from './Login';
import Home from './Home';
import Library from './Library';
import CreateExercise from './CreateExercise';
import Planner from './Planner';
import TrainingList from './TrainingList';
import Profile from './Profile';
import CourtMark from './CourtMark';
import InstallButton from './InstallButton';

const TITLES = {
  library: 'Übungen',
  create: 'Übung anlegen',
  planner: 'Training planen',
  trainings: 'Gespeicherte Trainings',
  profile: 'Profil',
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));
  const [page, setPage] = useState('home'); // Beim Öffnen immer die Startseite
  const [exercises, setExercises] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    const onLogout = () => setLoggedIn(false);
    window.addEventListener('coaches-logout', onLogout);
    return () => window.removeEventListener('coaches-logout', onLogout);
  }, []);

  // Zurück-Taste des Handys führt zur Startseite statt die App zu schließen
  useEffect(() => {
    try { history.replaceState({ page: 'home' }, ''); } catch { /* ignorieren */ }
    const onPop = (e) => setPage(e.state?.page || 'home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (next) => {
    if (next === page) return;
    try {
      if (page === 'home') history.pushState({ page: next }, '');
      else history.replaceState({ page: next }, '');
    } catch { /* ignorieren */ }
    setPage(next);
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    if (history.state?.page && history.state.page !== 'home') history.back();
    else setPage('home');
    window.scrollTo(0, 0);
  };

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

  if (!loggedIn) {
    return <Login onLoggedIn={() => { setLoggedIn(true); setPage('home'); }} />;
  }

  return (
    <div className={page === 'home' ? 'app is-home' : 'app'}>
      <header className="topbar no-print">
        <CourtMark />
        <div className="topbar-inner">
          {page === 'home' ? (
            <h1 className="brand"><img src="/icon.svg" alt="" className="brand-icon" />Coaches</h1>
          ) : (
            <div className="page-head">
              <button className="back-btn" onClick={goHome} aria-label="Zur Startseite">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                Start
              </button>
              <h1 className="page-title">{TITLES[page]}</h1>
            </div>
          )}
          <div className="account">
            <InstallButton />
          </div>
        </div>
      </header>

      <main className="content">
        {loadError && <p className="error no-print">{loadError}</p>}
        {page === 'home' && (
          <Home name={getName()} exercises={exercises} draftCount={draftCount} onOpen={go} />
        )}
        {page === 'library' && (
          <Library exercises={exercises} onChanged={loadExercises} onAdd={addToDraft} onGoUpload={() => go('create')} />
        )}
        {page === 'create' && <CreateExercise onSaved={loadExercises} />}
        {page === 'planner' && (
          <Planner draft={draft} setDraft={setDraft} exercises={exercises} onChanged={loadExercises} />
        )}
        {page === 'trainings' && (
          <TrainingList
            onOpen={(t) => {
              setDraft({
                id: t.id,
                title: t.title,
                age_group: t.age_group || '',
                training_date: t.training_date || '',
                notes: t.notes || '',
                shared: t.shared !== false,
                owner_id: t.owner_id || null,
                blocks: t.blocks,
              });
              go('planner');
            }}
          />
        )}
        {page === 'profile' && <Profile exercises={exercises} />}
      </main>
    </div>
  );
}
