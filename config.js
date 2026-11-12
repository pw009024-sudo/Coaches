// Hier kannst du die Kategorien jederzeit anpassen oder erweitern.

export const AGE_GROUPS = [
  'Minis (U8)',
  'E-Jugend (U10)',
  'D-Jugend (U12)',
  'C-Jugend (U14)',
  'B-Jugend (U16)',
  'A-Jugend (U18)',
  'Aktive',
];

// Wofür ist die Übung im Training gedacht?
export const AREAS = [
  'Erwärmung',
  'Erlernen neuer Techniken',
  'Festigung der Fähigkeiten',
  'Anwendung im Spiel',
  'Athletik & Kondition',
  'Positionstraining',
  'Abschluss & Cool-down',
];

// Positionen für das Positionstraining
export const POSITIONS = [
  'Torwart',
  'Linksaußen',
  'Rückraum links',
  'Rückraum Mitte',
  'Rückraum rechts',
  'Rechtsaußen',
  'Kreisläufer',
];

// Inhaltlicher Schwerpunkt
export const GOALS = [
  'Koordination',
  'Ballgewöhnung',
  'Passen & Fangen',
  'Wurf',
  '1 gegen 1 Angriff',
  '1 gegen 1 Abwehr',
  'Abwehrsystem',
  'Angriffskonzept',
  'Gegenstoß',
  'Rückzug',
  'Torwart',
];

export const METHODS = [
  'Spielform',
  'Übungsreihe',
  'Stationstraining',
  'Kleingruppe',
  'Wettkampfform',
  'Individualtraining',
];

export const PHASES = ['Aufwärmen', 'Hauptteil', 'Abschluss'];

// Welche Bereiche passen zu welcher Phase der Trainingsplanung?
export const PHASE_AREAS = {
  Aufwärmen: ['Erwärmung'],
  Hauptteil: ['Erlernen neuer Techniken', 'Festigung der Fähigkeiten', 'Anwendung im Spiel', 'Athletik & Kondition', 'Positionstraining'],
  Abschluss: ['Abschluss & Cool-down', 'Anwendung im Spiel'],
};


export function emptyDraft() {
  return {
    id: null,
    title: '',
    age_group: '',
    training_date: '',
    notes: '',
    shared: false,
    owner_id: null,
    blocks: PHASES.map((phase) => ({ phase, items: [] })),
  };
}

// Textfelder einer Übung (Reihenfolge = Reihenfolge in Formular, Ansicht und Ausdruck)
export const SECTIONS = [
  { key: 'setup', label: 'Aufbau', rows: 3, placeholder: 'Spielfeld, Positionen der Spieler, Hütchen …' },
  { key: 'material', label: 'Material', rows: 2, placeholder: 'z. B. 6 Bälle, 4 Hütchen, Leibchen' },
  { key: 'procedure', label: 'Ablauf', rows: 6, placeholder: 'Was passiert Schritt für Schritt?' },
  { key: 'extensions', label: 'Erweiterungen', rows: 3, placeholder: 'Varianten, Steigerungen, Wettkampfform …' },
];

// Textabschnitte einer Übung zum Anzeigen. Ältere Übungen haben nur eine „Beschreibung“.
export function exerciseSections(ex) {
  if (!ex) return [];
  const list = SECTIONS.map((s) => ({ label: s.label, text: (ex[s.key] || '').trim() })).filter((s) => s.text);
  if (list.length === 0 && ex.description?.trim()) return [{ label: 'Beschreibung', text: ex.description.trim() }];
  return list;
}

// Gesamter Text einer Übung für die Suche
export const exerciseSearchText = (ex) =>
  [ex.title, ex.description, ...SECTIONS.map((s) => ex[s.key])].filter(Boolean).join(' ').toLowerCase();
