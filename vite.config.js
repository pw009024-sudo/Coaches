import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';

// Alle Dateien liegen flach im Hauptverzeichnis (keine Unterordner nötig).
// Die App-Symbole und das Manifest werden beim Build nach "dist" kopiert.
const STATIC_FILES = [
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'favicon-32.png',
  'manifest.webmanifest',
];

const copyStatic = {
  name: 'copy-static-files',
  closeBundle() {
    STATIC_FILES.forEach((f) => copyFileSync(f, `dist/${f}`));
  },
};

export default defineConfig({
  plugins: [react(), copyStatic],
  publicDir: false,
  build: { target: 'es2022', chunkSizeWarningLimit: 1600 },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
});
