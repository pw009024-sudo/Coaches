// Verbindung der Oberfläche zum Server-Teil (netlify/functions/api.mjs)
const TOKEN_KEY = 'coaches-token';
const NAME_KEY = 'coaches-name';

const read = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const write = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* ignorieren */ } };

export const getToken = () => read(TOKEN_KEY);
export const getName = () => read(NAME_KEY);
export const saveLogin = (token, name) => { write(TOKEN_KEY, token); write(NAME_KEY, name); };
export const logout = () => { write(TOKEN_KEY, ''); window.dispatchEvent(new Event('coaches-logout')); };

export async function api(path, { method = 'GET', body, image } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (image) {
    payload = image;
    headers['Content-Type'] = 'image/webp';
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
