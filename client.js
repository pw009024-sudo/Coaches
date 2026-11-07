// Verbindung der Oberfläche zum Server-Teil (server.mjs)
const TOKEN_KEY = 'coaches-token';
const USER_KEY = 'coaches-user';

const read = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const write = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* ignorieren */ } };

export const getToken = () => read(TOKEN_KEY);
export const getUser = () => { try { return JSON.parse(read(USER_KEY)) || null; } catch { return null; } };
export const getName = () => getUser()?.name || '';
export const saveLogin = ({ token, user }) => { write(TOKEN_KEY, token); write(USER_KEY, JSON.stringify(user)); };
export const logout = () => { write(TOKEN_KEY, ''); write(USER_KEY, ''); window.dispatchEvent(new Event('coaches-logout')); };

// Ist das ein eigener Eintrag? Darf ich ihn löschen?
export const isMine = (item) => item.owner_id === getUser()?.id;
export const canDelete = (item) => !item.owner_id || isMine(item);
export const isShared = (item) => item.shared !== false;

export async function api(path, { method = 'GET', body, image } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (image) {
    payload = image;
    headers['Content-Type'] = image.type || 'image/jpeg';
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`/api/${path}`, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) logout();
  if (!res.ok) throw new Error(data.error || `Fehler ${res.status}`);
  return data;
}

export const imageUrl = (id) => `/api/images/${id}?t=${encodeURIComponent(getToken())}`;
