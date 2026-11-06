export default function TagPicker({ label, options, value, onChange, compact }) {
  const toggle = (opt) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <fieldset className={compact ? 'tagpicker compact' : 'tagpicker'}>
      <legend>{label}</legend>
      <div className="chips">
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            className={value.includes(opt) ? 'chip on' : 'chip'}
            aria-pressed={value.includes(opt)}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
