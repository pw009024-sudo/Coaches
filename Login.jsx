import { useEffect, useState } from 'react';
import { api, getName, saveLogin } from './api';
import CourtMark from './CourtMark';

export default function Login({ onLoggedIn }) {
  const [setupDone, setSetupDone] = useState(null);
  const [name, setName] = useState(getName());
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('status')
      .then((s) => setSetupDone(s.setup))
      .catch(() => setError('Der Server ist nicht erreichbar. Läuft die App auf Netlify?'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!setupDone && password !== repeat) return setError('Die beiden Passwörter stimmen nicht überein.');
    setBusy(true);
    try {
      const { token } = await api(setupDone ? 'login' : 'setup', { method: 'POST', body: { password } });
      saveLogin(token, name.trim());
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="login">
      <div className="login-panel">
        <CourtMark />
        <h1 className="brand"><img src="/icon.svg" alt="" className="brand-icon" />Coaches</h1>
        {setupDone === false && (
          <p className="muted">
            Willkommen! Lege einmalig ein Teampasswort fest. Alle Trainer melden sich später damit an.
          </p>
        )}
        {setupDone && <p className="muted">Melde dich mit deinem Namen und dem Teampasswort an.</p>}
        {setupDone !== null && (
          <form onSubmit={submit} className="stack">
            <label>
              Dein Name
              <input autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Thomas" />
            </label>
            <label>
              Teampasswort
              <input type="password" autoComplete={setupDone ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {!setupDone && (
              <label>
                Teampasswort wiederholen
                <input type="password" autoComplete="new-password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} />
              </label>
            )}
            <button className="btn primary" disabled={busy}>
              {busy ? 'Einen Moment …' : setupDone ? 'Anmelden' : 'Teampasswort festlegen'}
            </button>
          </form>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
