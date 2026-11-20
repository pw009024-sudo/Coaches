import { useEffect, useState } from 'react';
import { api } from './client.js';
import './home.css';

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const ICONS = {
  library: (
    <Icon>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="18" r="1.2" fill="currentColor" />
    </Icon>
  ),
  create: (
    <Icon>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </Icon>
  ),
  planner: (
    <Icon>
      <path d="M5 19c0-7 5-11 10.5-10.6" strokeDasharray="2.4 3.2" />
      <path d="M20 8.6l-5.4 3.2.7-6.3z" fill="currentColor" />
    </Icon>
  ),
  trainings: (
    <Icon>
      <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <path d="M8 13h8" />
    </Icon>
  ),
  profile: (
    <Icon>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3" />
    </Icon>
  ),
};

const TILES = [
  { id: 'library', title: 'Übungen', text: 'Alle Übungen durchsuchen und filtern' },
  { id: 'create', title: 'Übung anlegen', text: 'Einzeln mit Grafik oder per Import' },
  { id: 'planner', title: 'Training planen', text: 'Einheit zusammenstellen und als PDF erstellen', primary: true },
  { id: 'trainings', title: 'Gespeicherte Trainings', text: 'Eigene und gemeinsame Einheiten' },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Hallo';
  return 'Guten Abend';
};

// Startseite: große Kacheln für alle Bereiche
export default function Home({ name, exercises, draftCount, onOpen }) {
  const [trainingCount, setTrainingCount] = useState(null);

  useEffect(() => {
    api('trainings').then((list) => setTrainingCount(list.length)).catch(() => {});
  }, []);

  const meta = {
    library: `${exercises.length} ${exercises.length === 1 ? 'Übung' : 'Übungen'}`,
    create: '',
    planner: draftCount > 0 ? `${draftCount} ${draftCount === 1 ? 'Übung' : 'Übungen'} im Entwurf` : 'Neue Einheit beginnen',
    trainings: trainingCount === null ? '' : `${trainingCount} ${trainingCount === 1 ? 'Training' : 'Trainings'}`,
  };

  return (
    <section className="home">
      <div className="home-greeting">
        <p className="home-hello">{greeting()}{name ? `, ${name}` : ''}</p>
        <p className="muted">Was steht heute an?</p>
      </div>

      <nav className="home-grid" aria-label="Bereiche">
        {TILES.map((t) => (
          <button key={t.id} className={t.primary ? 'home-tile primary' : 'home-tile'} onClick={() => onOpen(t.id)}>
            <span className="home-icon">{ICONS[t.id]}</span>
            <span className="home-tile-title">{t.title}</span>
            <span className="home-tile-text">{t.text}</span>
            {meta[t.id] && <span className="home-tile-meta">{meta[t.id]}</span>}
          </button>
        ))}

        <button className="home-tile home-tile-wide" onClick={() => onOpen('profile')}>
          <span className="home-icon">{ICONS.profile}</span>
          <span className="home-wide-text">
            <span className="home-tile-title">Profil</span>
            <span className="home-tile-text">Konto, deine Übungen und Abmelden</span>
          </span>
          <svg className="home-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
        </button>
      </nav>
    </section>
  );
}
