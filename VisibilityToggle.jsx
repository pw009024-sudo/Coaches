// Umschalter: gemeinsam (alle Trainer) oder privat (nur ich)
export default function VisibilityToggle({ shared, onChange, label = 'Sichtbar für' }) {
  return (
    <fieldset className="visibility">
      <legend>{label}</legend>
      <div className="segmented">
        <button type="button" aria-pressed={shared} className={shared ? 'on' : ''} onClick={() => onChange(true)}>Alle Trainer</button>
        <button type="button" aria-pressed={!shared} className={!shared ? 'on' : ''} onClick={() => onChange(false)}>Nur mich</button>
      </div>
    </fieldset>
  );
}
