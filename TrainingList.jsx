import { useEffect, useState } from 'react';
import { api, isMine, isShared, canDelete } from './client.js';

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

  const mine = trainings.filter(isMine);
  const others = trainings.filter((t) => !isMine(t));

  const row = (t) => {
    const minutes = t.blocks.flatMap((b) => b.items).reduce((s, i) => s + (Number(i.minutes) || 0), 0);
    return (
      <li key={t.id} className="training-row">
        <div>
          <strong>
            {t.title}
            {isMine(t) && <span className={isShared(t) ? 'vis-tag shared' : 'vis-tag'}>{isShared(t) ? 'Gemeinsam' : 'Privat'}</span>}
          </strong>
          <span className="muted">
            {[t.training_date && new Date(t.training_date).toLocaleDateString('de-DE'), t.age_group, `${minutes} Min.`, !isMine(t) && t.created_by && `von ${t.created_by}`]
              .filter(Boolean).join(', ')}
          </span>
        </div>
        <div className="row">
          <button className="btn" onClick={() => onOpen(t)}>Öffnen</button>
          {canDelete(t) && <button className="btn ghost" onClick={() => remove(t)}>Löschen</button>}
        </div>
      </li>
    );
  };

  return (
    <>
      <section className="list-section">
        <h2>Meine Trainings</h2>
        {mine.length === 0 ? (
          <p className="empty-inline">Du hast noch keine Trainings gespeichert. Stelle unter „Training planen“ eine Einheit zusammen.</p>
        ) : (
          <ul className="training-list">{mine.map(row)}</ul>
        )}
      </section>
      <section className="list-section">
        <h2>Gemeinsame Trainings der anderen</h2>
        {others.length === 0 ? (
          <p className="empty-inline">Noch hat niemand ein Training für alle freigegeben.</p>
        ) : (
          <ul className="training-list">{others.map(row)}</ul>
        )}
      </section>
    </>
  );
}
