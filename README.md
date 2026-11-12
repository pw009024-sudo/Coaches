# Coaches

Handball-Trainingsplaner für dein Trainerteam. Übungen mit Beschreibung und Grafik (PNG) anlegen, nach Bereich, Position, Altersklasse, Schwerpunkt und Methode filtern und daraus Trainings planen.

Alles läuft nur mit GitHub und Netlify. Die Daten liegen in Netlify Blobs, dem Speicher, der in jedes Netlify-Projekt eingebaut ist. Es gibt keine Datenbank einzurichten und keine Umgebungsvariablen einzutragen.

## Aufbau

Alle Dateien liegen direkt im Hauptverzeichnis. Der Server-Teil steht in `server.mjs`; Netlify kopiert ihn beim Build automatisch an die richtige Stelle.

## Konten und Bereiche

Beim allerersten Aufruf legst du ein **Teampasswort** fest und erstellst dein eigenes Konto. Weitere Trainer wählen „Neu registrieren“, geben das Teampasswort ein und legen ihren Namen und ein persönliches Passwort fest. Danach melden sich alle nur noch mit Namen und persönlichem Passwort an.

Jede Übung und jedes Training ist entweder **gemeinsam** (alle Trainer sehen es) oder **privat** (nur du). Beim Hochladen und beim Speichern eines Trainings wählst du das aus und kannst es später jederzeit ändern. Gemeinsame Einträge dürfen alle bearbeiten, löschen und privat stellen darf sie nur, wer sie angelegt hat.

## Teampasswort zurücksetzen

In Netlify unter „Blobs“ den Speicher „coaches“ öffnen und den Eintrag `meta/auth` löschen. Beim nächsten Aufruf wird das Team neu eingerichtet. Achtung: Danach müssen sich alle neu registrieren; Übungen und Trainings bleiben erhalten.

## App aufs Handy legen

Die Seite im Browser öffnen, dann auf dem iPhone in Safari „Teilen → Zum Home-Bildschirm“, auf Android in Chrome „⋮ → Zum Startbildschirm hinzufügen“. Coaches erscheint dann mit dem schwarzen Pfeil-Symbol wie eine normale App.

## Anpassen

- Altersklassen, Ziele und Methoden stehen in `config.js`.
- Farben und Schriften stehen am Anfang von `styles.css`.
- Das App-Symbol ist `icon.svg`, die PNG-Varianten liegen daneben.

## Lokal testen (optional)

Der Server-Teil läuft nur über die Netlify CLI: `npm install`, dann `npx netlify dev`.

## Gut zu wissen

- Übungsblätter aus gekauften Büchern oder Verbandsmaterial nur im Rahmen der jeweiligen Nutzungsrechte im Team teilen.
