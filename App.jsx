import { useCallback, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from './lib/supabase';
import { emptyDraft } from './config';
import Login from './components/Login';
import Library from './components/Library';
import Upload from './components/Upload';
import Planner from './components/Planner';
import TrainingList from './components/TrainingList';
import CourtMark from './components/CourtMark';

const TABS = [
  { id: 'library', label: 'Übungen' },
  { id: 'upload', label: 'PDF hochladen' },
  { id: 'planner', label: 'Training planen' },
  { id: 'trainings', label: 'Gespeicherte Trainings' },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState('library');
  const [exercises, setExercises] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadExercises = useCallback(async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setLoadError('Übungen konnten nicht geladen werden: ' + error.message);
    else {
      setLoadError('');
      setExercises(data);
    }
  }, []);

  useEffect(() => {
    if (session) loadExercises();
  }, [session, loadExercises]);

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

  if (!supabaseConfigured) {
    return (
      <main className="setup-note">
        <h1>Fast geschafft</h1>
        <p>
          Die Verbindung zur Datenbank fehlt noch. Trage <code>VITE_SUPABASE_URL</code> und{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> bei Netlify unter „Environment variables“ ein
          (oder lokal in einer <code>.env</code>-Datei) und starte danach einen neuen Deploy.
        </p>
      </main>
    );
  }
  if (!authReady) return null;
  if (!session) return <Login />;

  return (
    <div className="app">
      <header className="topbar no-print">
        <CourtMark />
        <div className="topbar-inner">
          <h1 className="brand"><img src="/icon.svg" alt="" className="brand-icon" />Coaches</h1>
          <div className="account">
            <span>{session.user.email}</span>
            <button className="link-btn" onClick={() => supabase.auth.signOut()}>Abmelden</button>
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
          <Library
            exercises={exercises}
            userId={session.user.id}
            onChanged={loadExercises}
            onAdd={addToDraft}
            onGoUpload={() => setTab('upload')}
          />
        )}
        {tab === 'upload' && (
          <Upload onSaved={async () => { await loadExercises(); setTab('library'); }} />
        )}
        {tab === 'planner' && (
          <Planner
            draft={draft}
            setDraft={setDraft}
            exercises={exercises}
            onGoLibrary={() => setTab('library')}
          />
        )}
        {tab === 'trainings' && (
          <TrainingList
            userId={session.user.id}
            exercises={exercises}
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
