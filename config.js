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

export const GOALS = [
  'Aufwärmen',
  'Koordination',
  'Athletik',
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


export function emptyDraft() {
  return {
    id: null,
    title: '',
    age_group: '',
    training_date: '',
    notes: '',
    blocks: PHASES.map((phase) => ({ phase, items: [] })),
  };
}
