import { useState } from 'react';
import { supabase } from './supabase';
import CourtMark from './CourtMark';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.');
    setBusy(false);
  };

  return (
    <div className="login">
      <div className="login-panel">
        <CourtMark />
        <h1 className="brand"><img src="/icon.svg" alt="" className="brand-icon" />Coaches</h1>
        <p className="muted">Melde dich mit dem Zugang an, den dir dein Vereinsadmin angelegt hat.</p>
        <form onSubmit={submit} className="stack">
          <label>
            E-Mail
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Passwort
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={busy}>{busy ? 'Wird angemeldet …' : 'Anmelden'}</button>
        </form>
      </div>
    </div>
  );
}
