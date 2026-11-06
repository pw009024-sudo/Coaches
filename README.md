# Coaches

Handball-Trainingsplaner für dein Trainerteam.

Übungen aus PDFs hinterlegen (eine Seite = eine Übung, mit Bild), nach Altersklasse, Ziel und Methode filtern und daraus Trainingseinheiten planen. Mehrere Trainer teilen sich dieselbe Übungsdatenbank.

Technik: React + Vite (Oberfläche), Supabase (Login, Datenbank, Bildspeicher), Netlify (Hosting), GitHub (Code).

## 1. Supabase einrichten (ca. 10 Minuten)

1. Auf https://supabase.com kostenlos registrieren und ein neues Projekt anlegen. Als Region am besten „Central EU (Frankfurt)“ wählen.
2. Links **SQL Editor** öffnen, den kompletten Inhalt von `schema.sql` einfügen und auf **Run** klicken. Damit entstehen die Tabellen, die Zugriffsregeln und der Bildspeicher.
3. **Authentication → Sign In / Providers**: „Allow new users to sign up“ ausschalten. So kann sich niemand Fremdes selbst registrieren.
4. **Authentication → Users → Add user → Create new user**: Für jeden Trainer E-Mail und Passwort eintragen und „Auto Confirm User“ anhaken. Die Zugangsdaten gibst du den Trainern weiter.
5. **Project Settings → API** (bzw. „API Keys“): Notiere dir die **Project URL** und den **anon**- bzw. **publishable**-Key. Dieser Schlüssel darf im Browser stehen, die Daten schützen die Zugriffsregeln aus Schritt 2. Den „service_role“/„secret“-Key niemals verwenden oder hochladen.

## 2. Code auf GitHub

1. Auf GitHub ein neues Repository anlegen (z. B. `coaches`, gerne „Private“).
2. Alle Dateien aus diesem Ordner hochladen, entweder per „Add file → Upload files“ im Browser oder mit GitHub Desktop. Alle Dateien liegen direkt im Hauptverzeichnis, Unterordner gibt es nicht. Eine eventuelle `.env`-Datei gehört nicht dazu.

## 3. Veröffentlichen mit Netlify

1. Auf https://app.netlify.com anmelden → **Add new site → Import an existing project → GitHub** → Repository auswählen.
2. Build-Einstellungen werden aus `netlify.toml` übernommen (`npm run build`, Ordner `dist`).
3. Unter **Environment variables** zwei Einträge anlegen:
   - `VITE_SUPABASE_URL` = deine Project URL
   - `VITE_SUPABASE_ANON_KEY` = dein anon-/publishable-Key
4. **Deploy** klicken. Nach 1 bis 2 Minuten ist die App unter einer `.netlify.app`-Adresse erreichbar.

Wenn du die Variablen erst nach dem ersten Deploy einträgst: **Deploys → Trigger deploy → Deploy site**, damit sie übernommen werden.

Ab jetzt gilt: Jede Änderung, die du auf GitHub hochlädst, geht automatisch live.

## Lokal testen (optional)

Voraussetzung: Node.js 20 oder neuer.

```bash
cp .env.example .env    # Werte eintragen
npm install
npm run dev
```

## Anpassen

- Altersklassen, Ziele und Methoden stehen in `config.js`.
- Farben und Schriften stehen am Anfang von `styles.css`.

## App aufs Handy legen

Die Seite im Browser öffnen, dann auf dem iPhone in Safari „Teilen → Zum Home-Bildschirm“, auf Android in Chrome „⋮ → Zum Startbildschirm hinzufügen“. Coaches erscheint dann mit dem schwarzen Pfeil-Symbol wie eine normale App. Das Symbol liegt als `icon.svg` vor, die PNG-Varianten daneben.

## Gut zu wissen

- Eingescannte PDFs funktionieren auch: Das Bild der Seite wird gespeichert, nur die Volltextsuche findet darin nichts. Trage dann einen aussagekräftigen Titel ein.
- Löschen darf nur, wer eine Übung oder ein Training angelegt hat. Bearbeiten dürfen alle Trainer.
- Der kostenlose Supabase-Plan bietet 1 GB Dateispeicher. Ein Seitenbild ist meist 100 bis 300 KB groß, das reicht für einige tausend Übungen.
- Übungsblätter aus gekauften Büchern oder Verbandsmaterial nur im Rahmen der jeweiligen Nutzungsrechte im Team teilen.
