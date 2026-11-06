// Coaches: Server-Teil. Läuft automatisch als Netlify Function,
// speichert alles in Netlify Blobs (kein externer Dienst nötig).
import { getStore } from '@netlify/blobs';
import { randomBytes, randomUUID, scryptSync, createHmac, timingSafeEqual } from 'node:crypto';

export const config = { path: '/api/*' };

const COLLECTIONS = { exercises: 'ex/', trainings: 'tr/' };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

const tokenFor = (secret) => createHmac('sha256', secret).update('coaches-team').digest('hex');

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export default async (req) => {
  const store = getStore({ name: 'coaches', consistency: 'strong' });
  const url = new URL(req.url);
  const [resource, id] = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const method = req.method;

  try {
    const auth = await store.get('meta/auth', { type: 'json' });

    // Öffentlich: Status, erstes Festlegen des Teampassworts, Anmelden
    if (resource === 'status') return json({ setup: Boolean(auth) });

    if (resource === 'setup' && method === 'POST') {
      const { password } = await req.json();
      if (!password || password.length < 6) return json({ error: 'Das Teampasswort braucht mindestens 6 Zeichen.' }, 400);
      const salt = randomBytes(16).toString('hex');
      const record = {
        salt,
        hash: scryptSync(password, salt, 32).toString('hex'),
        secret: randomBytes(32).toString('hex'),
      };
      const result = await store.setJSON('meta/auth', record, { onlyIfNew: true });
      if (!result.modified) return json({ error: 'Das Teampasswort wurde bereits festgelegt.' }, 409);
      return json({ token: tokenFor(record.secret) });
    }

    if (resource === 'login' && method === 'POST') {
      if (!auth) return json({ error: 'Es ist noch kein Teampasswort festgelegt.' }, 400);
      const { password } = await req.json();
      const hash = scryptSync(String(password || ''), auth.salt, 32).toString('hex');
      if (!safeEqual(hash, auth.hash)) return json({ error: 'Falsches Teampasswort.' }, 401);
      return json({ token: tokenFor(auth.secret) });
    }

    // Ab hier nur mit gültiger Anmeldung
    const header = req.headers.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : url.searchParams.get('t');
    if (!auth || !token || !safeEqual(token, tokenFor(auth.secret))) {
      return json({ error: 'Bitte neu anmelden.' }, 401);
    }

    // Bilder der Übungen
    if (resource === 'images' && id) {
      const key = `img/${id}`;
      if (method === 'GET') {
        const data = await store.get(key, { type: 'arrayBuffer' });
        if (!data) return new Response('Nicht gefunden', { status: 404 });
        return new Response(data, {
          headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=31536000, immutable' },
        });
      }
      if (method === 'PUT') {
        const data = await req.arrayBuffer();
        if (data.byteLength > 5_000_000) return json({ error: 'Bild ist zu groß (max. 5 MB).' }, 413);
        await store.set(key, data);
        return json({ ok: true });
      }
    }

    // Übungen und Trainings
    const prefix = COLLECTIONS[resource];
    if (prefix) {
      if (method === 'GET' && !id) {
        const { blobs } = await store.list({ prefix });
        const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
        return json(items.filter(Boolean).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')));
      }
      if (method === 'POST' && !id) {
        const body = await req.json();
        const now = new Date().toISOString();
        const item = { ...body, id: body.id || randomUUID(), created_at: now, updated_at: now };
        await store.setJSON(prefix + item.id, item);
        return json(item, 201);
      }
      if (id && method === 'PUT') {
        const existing = await store.get(prefix + id, { type: 'json' });
        if (!existing) return json({ error: 'Nicht gefunden.' }, 404);
        const body = await req.json();
        const item = { ...existing, ...body, id, created_at: existing.created_at, updated_at: new Date().toISOString() };
        await store.setJSON(prefix + id, item);
        return json(item);
      }
      if (id && method === 'DELETE') {
        await store.delete(prefix + id);
        if (resource === 'exercises') await store.delete(`img/${id}`);
        return json({ ok: true });
      }
    }

    return json({ error: 'Unbekannte Anfrage.' }, 404);
  } catch (e) {
    return json({ error: e.message || 'Serverfehler.' }, 500);
  }
};
