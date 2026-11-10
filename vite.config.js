import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';

// Alle Dateien liegen flach im Hauptverzeichnis (keine Unterordner nötig).
// App-Symbole, Manifest und Service Worker werden beim Build unverändert nach "dist" kopiert.
// Sie behalten feste Adressen (ohne Zufallskennung), das braucht Android für die Installation.
const STATIC_FILES = [
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'favicon-32.png',
  'manifest.webmanifest',
  'sw.js',
];

const copyStatic = {
  name: 'copy-static-files',
  closeBundle() {
    STATIC_FILES.forEach((f) => copyFileSync(f, `dist/${f}`));
  },
};

// Verweise auf Manifest und Symbole erst nach Vite einfügen, damit sie nicht umbenannt werden
const appLinks = {
  name: 'app-links',
  transformIndexHtml: {
    order: 'post',
    handler: () => [
      { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.webmanifest' }, injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' }, injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'icon', href: '/favicon-32.png', sizes: '32x32', type: 'image/png' }, injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }, injectTo: 'head' },
    ],
  },
};

export default defineConfig({
  plugins: [react(), copyStatic, appLinks],
  publicDir: false,
  build: { target: 'es2022', chunkSizeWarningLimit: 1600 },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
});
