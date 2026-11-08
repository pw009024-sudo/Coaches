import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Maße der Form: runder Knopf oben rechts, der weich in das Menü übergeht
const R = 32; // Radius des runden Knopfs
const F = 18; // Radius der weichen Rundung zwischen Knopf und Menü
const C = 24; // Eckenradius des Menüs
const TOP = R + F; // Oberkante des Menüs

// Umriss als SVG-Pfad: Menü mit abgerundeten Ecken + Kreis oben rechts + Hohlkehle
function shapePath(w, h) {
  const left = w - 2 * R;
  return [
    `M ${C} ${TOP}`,
    `L ${left - F} ${TOP}`,
    `A ${F} ${F} 0 0 0 ${left} ${TOP - F}`,
    `A ${R} ${R} 0 0 1 ${w - R} 0`,
    `A ${R} ${R} 0 0 1 ${w} ${R}`,
    `L ${w} ${h - C}`,
    `A ${C} ${C} 0 0 1 ${w - C} ${h}`,
    `L ${C} ${h}`,
    `A ${C} ${C} 0 0 1 0 ${h - C}`,
    `L 0 ${TOP + C}`,
    `A ${C} ${C} 0 0 1 ${C} ${TOP}`,
    'Z',
  ].join(' ');
}

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 19c0-7 5-11 10.5-10.6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="2.6 3.4" />
    <path d="M20 9l-5.2 3.3.6-6.2z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);
const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
  </svg>
);

// Jede Zeile zeigt nur den Namen. Der kleine Pfeil am Ende (onOpen) öffnet die große Ansicht.
// onSelect (optional): Tipp auf den Namen löst eine Aktion aus, z. B. „zum Training hinzufügen“.
// badge: Inhalt des runden Knopfs (Standard: Anzahl), header: optionaler Bereich über der Liste (z. B. Suche)
export default function ExerciseDropdown({
  exercises,
  isPrivate,
  onSelect,
  onOpen,
  selectHint,
  badge,
  ariaLabel,
  header,
  emptyText = 'Keine Übung passt zu Suche und Filtern.',
}) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState('');
  const wrapRef = useRef(null);
  const shapeRef = useRef(null);
  const triggerRef = useRef(null);

  // Umriss an die tatsächliche Größe des Menüs anpassen
  useLayoutEffect(() => {
    if (!open || !shapeRef.current) return;
    const el = shapeRef.current;
    const update = () => setPath(shapePath(el.offsetWidth, el.offsetHeight));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, exercises.length]);

  // Schließen bei Klick daneben oder Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={open ? 'exdd open' : 'exdd'} ref={wrapRef}>
      <button
        ref={triggerRef}
        className="exdd-trigger"
        aria-expanded={open}
        aria-label={ariaLabel || `Übungen anzeigen (${exercises.length})`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={badge ? "exdd-badge plus" : "exdd-badge"}>{badge ?? exercises.length}</span>
      </button>

      {open && (
        <div className="exdd-shape" ref={shapeRef} style={path ? { clipPath: `path('${path}')` } : undefined}>
          {header && <div className="exdd-head">{header}</div>}
          <ul className="exdd-list">
            {exercises.length === 0 && <li className="exdd-empty">{emptyText}</li>}
            {exercises.map((e) => (
              <li key={e.id}>
                <div className="exdd-item">
                  <span className="exdd-icon">{isPrivate(e) ? <LockIcon /> : <ArrowIcon />}</span>
                  {onSelect ? (
                    <button
                      className="exdd-name exdd-name-btn"
                      title={selectHint}
                      onClick={() => { onSelect(e); setOpen(false); }}
                    >
                      {e.title}
                    </button>
                  ) : (
                    <span className="exdd-name">{e.title}</span>
                  )}
                  <button
                    className="exdd-more"
                    aria-label={`Details zu „${e.title}“ anzeigen`}
                    onClick={() => { onOpen(e); setOpen(false); }}
                  >
                    <ChevronIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
