import { useEffect, useState } from 'react';
import { api, saveLogin } from './client.js';
import CourtMark from './CourtMark';

// mode: 'setup' (allererster Start), 'login' oder 'register'
export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('status')
      .then((s) => setMode(s.setup ? 'login' : 'setup'))
      .catch(() => setError('Der Server ist nicht erreichbar. Läuft die App auf Netlify?'));
  }, []);

  const switchMode = (m) => { setMode(m); setError(''); setPassword(''); setRepeat(''); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode !== 'login' && password !== repeat) return setError('Die beiden Passwörter stimmen nicht überein.');
    setBusy(true);
    try {
      const body = mode === 'login' ? { name, password } : { name, password, teamPassword };
      saveLogin(await api(mode, { method: 'POST', body }));
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const intro = {
    setup: 'Willkommen! Lege einmalig ein Teampasswort fest und erstelle dein eigenes Konto. Mit dem Teampasswort können sich später weitere Trainer registrieren.',
    login: 'Melde dich mit deinem Namen und deinem persönlichen Passwort an.',
    register: 'Neu im Team? Erstelle dein Konto. Das Teampasswort bekommst du von einem anderen Trainer.',
  };
  const action = { setup: 'Team einrichten', login: 'Anmelden', register: 'Konto erstellen' };

  return (
    <div className="login">
      <div className="login-panel">
        <CourtMark />
        <h1 className="brand"><img src="/icon.svg" alt="" className="brand-icon" />Coaches</h1>

        {(mode === 'login' || mode === 'register') && (
          <div className="segmented" role="tablist">
            <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'on' : ''} onClick={() => switchMode('login')}>Anmelden</button>
            <button role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'on' : ''} onClick={() => switchMode('register')}>Neu registrieren</button>
          </div>
        )}

        {mode && (
          <>
            <p className="muted">{intro[mode]}</p>
            <form onSubmit={submit} className="stack">
              {mode !== 'login' && (
                <label>
                  Teampasswort
                  <input type="password" autoComplete="off" required minLength={6} value={teamPassword} onChange={(e) => setTeamPassword(e.target.value)} />
                </label>
              )}
              <label>
                Dein Name
                <input autoComplete="username" required value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Thomas" />
              </label>
              <label>
                {mode === 'login' ? 'Dein Passwort' : 'Dein persönliches Passwort'}
                <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              {mode !== 'login' && (
                <label>
                  Passwort wiederholen
                  <input type="password" autoComplete="new-password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} />
                </label>
              )}
              <button className="btn primary" disabled={busy}>{busy ? 'Einen Moment …' : action[mode]}</button>
            </form>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
