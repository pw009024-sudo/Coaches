// Coaches: Server-Teil. Wird beim Build automatisch nach netlify/functions/api.mjs kopiert
// und läuft als Netlify Function. Speichert alles in Netlify Blobs.
import { getStore } from '@netlify/blobs';
import { randomBytes, randomUUID, scryptSync, createHmac, createHash, timingSafeEqual } from 'node:crypto';

export const config = { path: '/api/*' };

const COLLECTIONS = { exercises: 'ex/', trainings: 'tr/' };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

const hashPassword = (password, salt) => scryptSync(String(password || ''), salt, 32).toString('hex');
const newPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  return { salt, hash: hashPassword(password, salt) };
};
const checkPassword = (password, rec) => safeEqual(hashPassword(password, rec.salt), rec.hash);

const userKey = (name) => 'users/' + createHash('sha256').update(name.trim().toLowerCase()).digest('hex');

const sign = (secret, data) => createHmac('sha256', secret).update(data).digest('hex');
const makeToken = (secret, user) => {
  const payload = Buffer.from(JSON.stringify({ id: user.id, name: user.name })).toString('base64url');
  return `${payload}.${sign(secret, payload)}`;
};
const readToken = (secret, token) => {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig || !safeEqual(sig, sign(secret, payload))) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
};

// Wer darf was?
const isOwner = (item, user) => item.owner_id === user.id;
const canSee = (item, user) => item.shared !== false || isOwner(item, user);
const canDelete = (item, user) => !item.owner_id || isOwner(item, user);

const loginResult = (secret, user) => ({ token: makeToken(secret, user), user: { id: user.id, name: user.name } });

async function createUser(store, name, password) {
  if (!name || name.trim().length < 2) throw Object.assign(new Error('Bitte gib deinen Namen ein.'), { status: 400 });
  if (!password || password.length < 6) throw Object.assign(new Error('Dein Passwort braucht mindestens 6 Zeichen.'), { status: 400 });
  const user = { id: randomUUID(), name: name.trim(), ...newPassword(password), created_at: new Date().toISOString() };
  const result = await store.setJSON(userKey(name), user, { onlyIfNew: true });
  if (!result.modified) throw Object.assign(new Error('Diesen Namen gibt es schon. Bitte melde dich an oder wähle einen anderen Namen.'), { status: 409 });
  return user;
}

export default async (req) => {
  const store = getStore({ name: 'coaches', consistency: 'strong' });
  const url = new URL(req.url);
  const [resource, id] = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const method = req.method;

  try {
    const team = await store.get('meta/auth', { type: 'json' });

    // ---------- Öffentlich ----------
    if (resource === 'status') return json({ setup: Boolean(team) });

    // Allererster Start: Teampasswort festlegen und eigenes Konto anlegen
    if (resource === 'setup' && method === 'POST') {
      const { teamPassword, name, password } = await req.json();
      if (!teamPassword || teamPassword.length < 6) return json({ error: 'Das Teampasswort braucht mindestens 6 Zeichen.' }, 400);
      if (!name || name.trim().length < 2) return json({ error: 'Bitte gib deinen Namen ein.' }, 400);
      if (!password || password.length < 6) return json({ error: 'Dein Passwort braucht mindestens 6 Zeichen.' }, 400);
      const record = { ...newPassword(teamPassword), secret: randomBytes(32).toString('hex') };
      const result = await store.setJSON('meta/auth', record, { onlyIfNew: true });
      if (!result.modified) return json({ error: 'Das Team ist bereits eingerichtet. Bitte registriere dich.' }, 409);
      const user = await createUser(store, name, password);
      return json(loginResult(record.secret, user));
    }

    // Neues Trainerkonto: braucht das Teampasswort als „Eintrittskarte“
    if (resource === 'register' && method === 'POST') {
      if (!team) return json({ error: 'Das Team ist noch nicht eingerichtet.' }, 400);
      const { teamPassword, name, password } = await req.json();
      if (!checkPassword(teamPassword, team)) return json({ error: 'Das Teampasswort stimmt nicht.' }, 403);
      const user = await createUser(store, name, password);
      return json(loginResult(team.secret, user));
    }

    if (resource === 'login' && method === 'POST') {
      if (!team) return json({ error: 'Das Team ist noch nicht eingerichtet.' }, 400);
      const { name, password } = await req.json();
      const user = name ? await store.get(userKey(name), { type: 'json' }) : null;
      if (!user || !checkPassword(password, user)) return json({ error: 'Name oder Passwort stimmen nicht.' }, 403);
      return json(loginResult(team.secret, user));
    }

    // ---------- Ab hier nur angemeldet ----------
    const header = req.headers.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : url.searchParams.get('t');
    const user = team && readToken(team.secret, token);
    if (!user) return json({ error: 'Bitte neu anmelden.' }, 401);

    // Bilder der Übungen (gleiche Sichtbarkeit wie die Übung)
    if (resource === 'images' && id) {
      const key = `img/${id}`;
      if (method === 'GET') {
        const ex = await store.get(`ex/${id}`, { type: 'json' });
        if (ex && !canSee(ex, user)) return new Response('Kein Zugriff', { status: 403 });
        const result = await store.getWithMetadata(key, { type: 'arrayBuffer' });
        if (!result) return new Response('Nicht gefunden', { status: 404 });
        return new Response(result.data, {
          headers: {
            'content-type': result.metadata?.type || 'image/webp',
            'cache-control': 'private, max-age=31536000, immutable',
          },
        });
      }
      if (method === 'PUT') {
        // Neues Bild oder Bild einer bestehenden Übung ersetzen (wer die Übung sehen darf, darf sie bearbeiten)
        const ex = await store.get(`ex/${id}`, { type: 'json' });
        if (ex && !canSee(ex, user)) return json({ error: 'Kein Zugriff.' }, 403);
        const data = await req.arrayBuffer();
        if (data.byteLength > 5_500_000) return json({ error: 'Bild ist zu groß.' }, 413);
        const type = req.headers.get('content-type') || 'image/webp';
        if (!/^image\/(webp|jpeg|png)$/.test(type)) return json({ error: 'Unbekanntes Bildformat.' }, 415);
        await store.set(key, data, { metadata: { type } });
        return json({ ok: true });
      }
      if (method === 'DELETE') {
        const ex = await store.get(`ex/${id}`, { type: 'json' });
        if (ex && !canSee(ex, user)) return json({ error: 'Kein Zugriff.' }, 403);
        await store.delete(key);
        return json({ ok: true });
      }
    }

    const prefix = COLLECTIONS[resource];
    if (prefix) {
      if (method === 'GET' && !id) {
        const { blobs } = await store.list({ prefix });
        const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
        return json(
          items
            .filter((i) => i && canSee(i, user))
            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        );
      }

      if (method === 'POST' && !id) {
        const body = await req.json();
        const now = new Date().toISOString();
        const item = {
          ...body,
          id: body.id || randomUUID(),
          shared: body.shared !== false,
          owner_id: user.id,
          created_by: user.name,
          created_at: now,
          updated_at: now,
        };
        await store.setJSON(prefix + item.id, item);
        return json(item, 201);
      }

      if (id) {
        const existing = await store.get(prefix + id, { type: 'json' });
        if (!existing || !canSee(existing, user)) return json({ error: 'Nicht gefunden.' }, 404);

        if (method === 'PUT') {
          const { owner_id, created_by, created_at, shared, ...body } = await req.json();
          const item = { ...existing, ...body, id, updated_at: new Date().toISOString() };
          // Nur wer den Eintrag angelegt hat, entscheidet über privat oder gemeinsam
          if (typeof shared === 'boolean' && (isOwner(existing, user) || !existing.owner_id)) {
            item.shared = shared;
            if (!existing.owner_id) { item.owner_id = user.id; item.created_by = user.name; }
          }
          await store.setJSON(prefix + id, item);
          return json(item);
        }

        if (method === 'DELETE') {
          if (!canDelete(existing, user)) return json({ error: 'Löschen darf nur, wer den Eintrag angelegt hat.' }, 403);
          await store.delete(prefix + id);
          if (resource === 'exercises') await store.delete(`img/${id}`);
          return json({ ok: true });
        }
      }
    }

    return json({ error: 'Unbekannte Anfrage.' }, 404);
  } catch (e) {
    return json({ error: e.message || 'Serverfehler.' }, e.status || 500);
  }
};
