import { useEffect, useState } from 'react';
import { api, getUser, isMine, isShared, logout } from './client.js';
import './home.css';

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

export default function Profile({ exercises }) {
  const user = getUser();
  const [trainings, setTrainings] = useState(null);

  useEffect(() => {
    api('trainings').then(setTrainings).catch(() => setTrainings([]));
  }, []);

  const mine = exercises.filter(isMine);
  const minePrivate = mine.filter((e) => !isShared(e)).length;
  const myTrainings = (trainings || []).filter(isMine);

  const stats = [
    { value: mine.length, label: 'Übungen von dir', sub: minePrivate ? `davon ${minePrivate} privat` : 'alle für das Team' },
    { value: trainings === null ? '…' : myTrainings.length, label: 'Trainings von dir' },
    { value: exercises.length, label: 'Übungen im Team' },
    { value: trainings === null ? '…' : trainings.length, label: 'Trainings im Team' },
  ];

  return (
    <section className="profile">
      <div className="panel profile-card">
        <span className="profile-avatar" aria-hidden="true">{initials(user?.name)}</span>
        <div>
          <h2>{user?.name || 'Trainer'}</h2>
          <p className="muted small">Angemeldet bei Coaches</p>
        </div>
      </div>

      <div className="profile-stats">
        {stats.map((s) => (
          <div key={s.label} className="panel profile-stat">
            <span className="profile-stat-value">{s.value}</span>
            <span className="profile-stat-label">{s.label}</span>
            {s.sub && <span className="muted small">{s.sub}</span>}
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>Neue Trainer ins Team holen</h3>
        <p className="muted small">
          Neue Trainer öffnen Coaches, wählen „Neu registrieren“ und geben das Teampasswort ein. Danach legen sie ihren
          Namen und ein eigenes Passwort fest.
        </p>
      </div>

      <button className="btn profile-logout" onClick={logout}>Abmelden</button>
    </section>
  );
}
