// Coaches Service Worker: macht die App auf Handys installierbar
// und zeigt ohne Internet eine verständliche Meldung statt einer Fehlerseite.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<title>Coaches</title><body style="font-family:system-ui;background:#000;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:1rem">' +
            '<div><h1>Keine Internetverbindung</h1><p>Coaches braucht Internet, um Übungen und Trainings zu laden.</p></div>',
          { headers: { 'content-type': 'text/html; charset=utf-8' } }
        )
    )
  );
});
