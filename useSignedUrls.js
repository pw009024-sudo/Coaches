import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { BUCKET } from './config';

// Die Bilder liegen privat. Für die Anzeige holen wir zeitlich begrenzte Links
// und merken sie uns, damit nicht bei jedem Klick neu geladen wird.
const cache = new Map(); // path -> { url, expires }
const LIFETIME = 60 * 60; // Sekunden

export function useSignedUrls(paths) {
  const key = paths.join('|');
  const [urls, setUrls] = useState(() => fromCache(paths));

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    const missing = paths.filter((p) => !(cache.get(p)?.expires > now));
    setUrls(fromCache(paths));
    if (missing.length === 0) return;

    (async () => {
      for (let i = 0; i < missing.length; i += 100) {
        const chunk = missing.slice(i, i + 100);
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(chunk, LIFETIME);
        if (error || !data) continue;
        const expires = Date.now() + (LIFETIME - 120) * 1000;
        data.forEach((d) => d.signedUrl && cache.set(d.path, { url: d.signedUrl, expires }));
      }
      if (!cancelled) setUrls(fromCache(paths));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}

function fromCache(paths) {
  const out = {};
  paths.forEach((p) => { if (cache.get(p)) out[p] = cache.get(p).url; });
  return out;
}
