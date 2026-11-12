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
