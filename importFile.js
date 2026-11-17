// Liest eine Coaches-Importdatei (.json) und prüft jede Übung.
// Aufbau der Datei:
// {
//   "format": "coaches-import",
//   "uebungen": [
//     {
//       "name": "Kreuzen im Rückraum",
//       "aufbau": "…", "material": "…", "ablauf": "…", "erweiterungen": "…",
//       "bereich": ["Festigung der Fähigkeiten"], "positionen": [], "altersklasse": ["D-Jugend (U12)"],
//       "schwerpunkt": ["Wurf"], "methode": ["Übungsreihe"],
//       "spieler": 6, "dauer": 15,
//       "grafik": "data:image/png;base64,…"   (optional)
//     }
//   ]
// }
// Englische Feldnamen (title, setup, procedure …) werden ebenfalls verstanden.
import { AREAS, POSITIONS, AGE_GROUPS, GOALS, METHODS } from './config';

const LISTS = [
  { key: 'areas', names: ['bereich', 'areas'], options: AREAS, label: 'Bereich' },
  { key: 'positions', names: ['positionen', 'positions'], options: POSITIONS, label: 'Position' },
  { key: 'age_groups', names: ['altersklasse', 'age_groups'], options: AGE_GROUPS, label: 'Altersklasse' },
  { key: 'goals', names: ['schwerpunkt', 'goals'], options: GOALS, label: 'Schwerpunkt' },
  { key: 'methods', names: ['methode', 'methods'], options: METHODS, label: 'Methode' },
];
const TEXTS = [
  { key: 'setup', names: ['aufbau', 'setup'] },
  { key: 'material', names: ['material'] },
  { key: 'procedure', names: ['ablauf', 'procedure'] },
  { key: 'extensions', names: ['erweiterungen', 'extensions'] },
];

const pick = (obj, names) => {
  for (const n of names) if (obj[n] !== undefined && obj[n] !== null) return obj[n];
  return undefined;
};
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
const toList = (v) => (Array.isArray(v) ? v : v ? String(v).split(/[,;]/) : []).map((x) => String(x).trim()).filter(Boolean);
const toNumber = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist keine gültige Coaches-Importdatei.');
  }
  const raw = Array.isArray(data) ? data : data.uebungen || data.exercises;
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('In der Datei wurden keine Übungen gefunden.');

  return raw.map((r, i) => {
    const warnings = [];
    const item = { key: `imp-${i}` };
    item.title = String(pick(r, ['name', 'titel', 'title']) || '').trim().slice(0, 120);
    if (!item.title) warnings.push('Kein Name angegeben');

    for (const t of TEXTS) item[t.key] = String(pick(r, t.names) || '').trim();

    for (const l of LISTS) {
      const values = [];
      for (const v of toList(pick(r, l.names))) {
        const match = l.options.find((o) => norm(o) === norm(v));
        if (match) values.push(match);
        else warnings.push(`${l.label} „${v}“ ist unbekannt und wird weggelassen`);
      }
      item[l.key] = [...new Set(values)];
    }
    if (!item.areas.includes('Positionstraining')) item.positions = [];
    else if (item.positions.length === 0) warnings.push('Positionstraining ohne Position');

    item.min_players = toNumber(pick(r, ['spieler', 'min_players']));
    item.duration_min = toNumber(pick(r, ['dauer', 'duration_min']));

    const img = pick(r, ['grafik', 'bild', 'image']);
    item.imageData = typeof img === 'string' && /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(img) ? img : null;
    if (img && !item.imageData) warnings.push('Grafik konnte nicht gelesen werden');

    item.warnings = warnings;
    return item;
  });
}

// Grafik aus der Importdatei in eine Bilddatei umwandeln
export async function imageBlob(dataUrl) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const type = blob.type === 'image/jpg' ? 'image/jpeg' : blob.type;
  return type === blob.type ? blob : new Blob([blob], { type });
}

// Daten für den Server
export function importPayload(item) {
  return {
    title: item.title,
    setup: item.setup,
    material: item.material,
    procedure: item.procedure,
    extensions: item.extensions,
    description: '',
    areas: item.areas,
    positions: item.positions,
    age_groups: item.age_groups,
    goals: item.goals,
    methods: item.methods,
    min_players: item.min_players,
    duration_min: item.duration_min,
  };
}
