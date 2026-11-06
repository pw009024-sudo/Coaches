import { useEffect, useState } from 'react';
import { api } from './api';

const sortKey = (t) => t.training_date || t.updated_at || '';

export default function TrainingList({ onOpen }) {
  const [trainings, setTrainings] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await api('trainings');
      setTrainings(data.sort((a, b) => sortKey(b).localeCompare(sortKey(a))));
    } catch (e) {
      setError('Trainings konnten nicht geladen werden: ' + e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (t) => {
    if (!confirm(`„${t.title}“ löschen?`)) return;
    try {
      await api(`trainings/${t.id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError('Löschen fehlgeschlagen: ' + e.message);
    }
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
                {[t.training_date && new Date(t.training_date).toLocaleDateString('de-DE'), t.age_group, `${minutes} Min.`, t.created_by && `von ${t.created_by}`]
                  .filter(Boolean).join(', ')}
              </span>
            </div>
            <div className="row">
              <button className="btn" onClick={() => onOpen(t)}>Öffnen</button>
              <button className="btn ghost" onClick={() => remove(t)}>Löschen</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
