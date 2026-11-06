import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function TrainingList({ userId, onOpen }) {
  const [trainings, setTrainings] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .order('training_date', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });
    if (error) setError('Trainings konnten nicht geladen werden: ' + error.message);
    else setTrainings(data);
  };

  useEffect(() => { load(); }, []);

  const remove = async (t) => {
    if (!confirm(`„${t.title}“ löschen?`)) return;
    const { error } = await supabase.from('trainings').delete().eq('id', t.id);
    if (error) setError('Löschen fehlgeschlagen: ' + error.message);
    else load();
  };

  if (error) return <p className="error">{error}</p>;
  if (!trainings) return <p className="muted">Wird geladen …</p>;
  if (trainings.length === 0) {
    return (
      <div className="empty">
        <h2>Noch keine Trainings gespeichert</h2>
        <p>Stelle unter „Training planen“ eine Einheit zusammen und speichere sie, dann steht sie hier für alle Trainer bereit.</p>
      </div>
    );
  }

  return (
    <ul className="training-list">
      {trainings.map((t) => {
        const minutes = t.blocks.flatMap((b) => b.items).reduce((s, i) => s + (Number(i.minutes) || 0), 0);
        return (
          <li key={t.id} className="training-row">
            <div>
              <strong>{t.title}</strong>
              <span className="muted">
                {[t.training_date && new Date(t.training_date).toLocaleDateString('de-DE'), t.age_group, `${minutes} Min.`]
                  .filter(Boolean).join(', ')}
              </span>
            </div>
            <div className="row">
              <button className="btn" onClick={() => onOpen(t)}>Öffnen</button>
              {t.created_by === userId && <button className="btn ghost" onClick={() => remove(t)}>Löschen</button>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
