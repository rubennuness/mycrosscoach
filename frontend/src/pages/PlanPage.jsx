import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Toast from '../components/Toast';
import './PlanPage.css'; // Estilo acima

function PlanPage() {
  const { athleteId } = useParams();
  const [selectedDay, setSelectedDay] = useState('Segunda');
  const [phases, setPhases] = useState([{ title: '', text: '' }]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!athleteId || !selectedDay) return;

    fetch(`http://192.168.56.105:3000/api/plans/day/${athleteId}/${selectedDay}`)
      .then(res => res.json())
      .then(data => {
        if (data.phases) {
          setPhases(data.phases.length > 0 ? data.phases : [{ title: '', text: '' }]);
        } else {
          setPhases([{ title: '', text: '' }]);
        }
      })
      .catch(err => console.error(err));
  }, [athleteId, selectedDay]);

  const handleAddPhase = () => {
    setPhases([...phases, { title: '', text: '' }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const planData = { day_of_week: selectedDay, phases };

    fetch(`http://192.168.56.105:3000/api/plans/${athleteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    })
      .then(res => {
        if (!res.ok) throw new Error('Falha ao criar plano');
        return res.json();
      })
      .then(() => setToastMessage('Plano criado/atualizado!'))
      .catch(() => setToastMessage('Ocorreu um erro ao criar/atualizar o plano.'));
  };

  const handleCloseToast = () => {
    setToastMessage('');
  };

  return (
    <div className="planpage-container">
      <div className="planpage-left">
        <div className="planpage-left-content">
          <h1 style={{ marginBottom: 20 }}>Editar Plano do Atleta {athleteId}</h1>

          <form onSubmit={handleSubmit} className="plan-form">
            <div>
              <label>Dia da semana:</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                <option>Segunda</option>
                <option>Terça</option>
                <option>Quarta</option>
                <option>Quinta</option>
                <option>Sexta</option>
                <option>Sábado</option>
                <option>Domingo</option>
              </select>
            </div>

            <div>
              <h3>Fases do Treino</h3>
              {phases.map((phase, i) => (
  <div key={i} style={{ marginBottom: '16px' }}>
    <label>Título da Fase {i + 1}:</label>
    <input
      type="text"
      value={phase.title}
      onChange={(e) => {
        const arr = [...phases];
        arr[i].title = e.target.value;
        setPhases(arr);
      }}
      style={{ width: '100%', marginBottom: 6 }}
    />

    <label>Descrição:</label>
    <textarea
      rows="3"
      value={phase.text}
      onChange={(e) => {
        const arr = [...phases];
        arr[i].text = e.target.value;
        setPhases(arr);
      }}
    />

    {/* ---------- NOVO ------------- */}
    {phase.status && phase.status !== 'pending' && (
      <span className={`badge ${phase.status}`} style={{ marginTop: 6 }}>
        {phase.status === 'completed' ? 'Concluído' : 'Falhou'}
      </span>
    )}
    {/* ----------------------------- */}
  </div>
))}
              <button type="button" onClick={handleAddPhase} style={{ marginRight: 10 }}>
                + Adicionar Fase
              </button>
            </div>

            <button type="submit" style={{ marginTop: 10 }}>
              Guardar Plano
            </button>
          </form>

          <Toast message={toastMessage} onClose={handleCloseToast} />
        </div>
      </div>

      <div className="planpage-right"></div>
    </div>
  );
}

export default PlanPage;
