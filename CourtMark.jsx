// Torraum (6 m, durchgezogen) und Freiwurflinie (9 m, gestrichelt) als Kopfzeilen-Motiv.
export default function CourtMark() {
  return (
    <svg className="court-mark" viewBox="0 0 400 200" aria-hidden="true" preserveAspectRatio="xMaxYMid slice">
      <path d="M400 20 A 120 120 0 0 0 400 260" fill="none" stroke="currentColor" strokeWidth="5" />
      <path d="M400 -40 A 180 180 0 0 0 400 320" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="22 16" />
      <line x1="388" y1="110" x2="400" y2="110" stroke="currentColor" strokeWidth="5" />
    </svg>
  );
}
