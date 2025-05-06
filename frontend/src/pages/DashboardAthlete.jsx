// src/pages/DashboardAthlete.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HamburgerMenu from '../components/HamburgerMenu';
import './Dashboard.css';

function DashboardAthlete() {
  const navigate                     = useNavigate();
  const [daysOfWeek,   setDaysOfWeek]    = useState([]);
  const [trainingPlans,setTrainingPlans] = useState({});
  const [selectedDay,  setSelectedDay]   = useState(null);

  /* progresso local */
  const [phaseStatus,  setPhaseStatus]   = useState({});  // ex.: "Segunda-0": 'completed'
  const [phaseComment, setPhaseComment]  = useState({});  // ex.: "Segunda-0": '…'

  const user      = JSON.parse(localStorage.getItem('user'));
  const athleteId = user?.id;

  /* ▼ 1. CARREGA estrutura da semana (sem progresso) -------------------- */
  useEffect(() => {
    if (!athleteId) return;
    fetch(`https://mycrosscoach-production.up.railway.app/api/training/week/${athleteId}`)
      .then(r => r.json())
      .then(d => {
        setDaysOfWeek(d.daysOfWeek);
        setTrainingPlans(d.plans);        // { 'Segunda': [ … ] , … }
      })
      .catch(console.error);
  }, [athleteId]);

  /* ▼ 2. CARREGA progresso quando o dia muda --------------------------- */
  useEffect(() => {
    if (!athleteId || !selectedDay) return;

    fetch(`https://mycrosscoach-production.up.railway.app/api/plans/day/${athleteId}/${selectedDay}`)
      .then(r => r.json())
      .then(data => {
        if (!data.phases) return;

        /* 2.a) sobre-escreve as fases desse dia (mantém outros dias) */
        setTrainingPlans(prev => ({ ...prev, [selectedDay]: data.phases }));

        /* 2.b) extrai status/comment recebidos e funde com o que já tínhamos */
        const newStat = {};
        const newComm = {};

        data.phases.forEach((ph, idx) => {
          const k = `${selectedDay}-${idx}`;
          if (ph.status && ph.status !== 'pending') newStat[k]  = ph.status;
          if (ph.comment)                           newComm[k]  = ph.comment;
        });

        setPhaseStatus (prev => ({ ...prev, ...newStat  }));
        setPhaseComment(prev => ({ ...prev, ...newComm }));
      })
      .catch(console.error);
  }, [athleteId, selectedDay]);
  /* -------------------------------------------------------------------- */

  /* ---------- restantes hooks e funções já existentes ---------- */
  const phasesArray = selectedDay ? (trainingPlans[selectedDay] || []) : [];

  const completionRate = () => {
    if (!selectedDay || phasesArray.length === 0) return 0;
    const done = phasesArray.reduce(
      (acc, _, idx) =>
        phaseStatus[`${selectedDay}-${idx}`] === 'completed' ? acc + 1 : acc,
      0
    );
    return Math.round((done / phasesArray.length) * 100);
  };

  const markPhase = (idx, status) => {
    if (!selectedDay) return;
    const key       = `${selectedDay}-${idx}`;
    const previous  = phaseStatus[key];
    const newStatus =
      status === 'completed' && previous === 'completed'
        ? undefined
        : status;

    /* 1. UI imediata */
    setPhaseStatus(p => ({ ...p, [key]: newStatus }));

    /* 2. grava se houver id - a partir daqui tudo igual ao que já tinhas */
    const phase = phasesArray[idx];
    if (!phase?.id || !newStatus) return;

    fetch('https://mycrosscoach-production.up.railway.app/api/progress', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        athlete_id    : athleteId,
        plan_phase_id : phase.id,
        status        : newStatus,
        comment       : phaseComment[key] || ''
      })
    }).catch(console.error);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  /* ---------- JSX original (inalterado) ---------- */
  return (
    <div className="dashboard-split-container">
      <div className="dashboard-left">
        <div className="dashboard-left-content">
          <div className="dash-header">
            <HamburgerMenu />
            <h2>Meu Plano de Treino (Atleta)</h2>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {/* botões dos dias */}
          <div className="days-list">
            {daysOfWeek.map(day => (
              <button
                key={day}
                className={`day-button ${selectedDay === day ? 'active' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          {/* detalhes */}
          <div className="plan-details">
            {!selectedDay && <p>Selecione um dia para ver o plano.</p>}

            {selectedDay && (
              <>
                <h3 style={{ marginBottom: 10 }}>{selectedDay}</h3>

                {phasesArray.length > 0 && (
                  <div className="progress-wrapper">
                    <div
                      className="progress-bar"
                      style={{ width: `${completionRate()}%` }}
                    />
                    <span className="progress-text">{completionRate()}%</span>
                  </div>
                )}

                {phasesArray.length === 0 ? (
                  <p>Nenhum plano para este dia.</p>
                ) : (
                  <div className="phases-container">
                    {phasesArray.map((ph, idx) => {
                      const key  = `${selectedDay}-${idx}`;
                      const stat = phaseStatus[key];

                      return (
                        <div key={idx} className="phase-box">
                          <strong>{ph.title || `Fase ${idx + 1}`}</strong>
                          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
                            {ph.text || ph}
                          </pre>

                          <div style={{ marginTop: 8 }}>
                            <button
                              className={`status-btn ${
                                stat === 'completed' ? 'on completed' : ''
                              }`}
                              onClick={() => markPhase(idx, 'completed')}
                            >
                              Completed
                            </button>

                            <button
                              className={`status-btn ${
                                stat === 'missed' ? 'on missed' : ''
                              }`}
                              onClick={() => markPhase(idx, 'missed')}
                              style={{ marginLeft: 8 }}
                            >
                              Missed
                            </button>
                          </div>

                          <textarea
                            className="comment-box"
                            rows={2}
                            placeholder="Comentário (opcional)"
                            value={phaseComment[key] || ''}
                            onChange={e =>
                              setPhaseComment(p => ({
                                ...p,
                                [key]: e.target.value
                              }))
                            }
                            onBlur={() => {
                              const sNow = phaseStatus[key];
                              if (!sNow || !ph?.id) return;
                              fetch('/api/progress', {
                                method : 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body   : JSON.stringify({
                                  athlete_id    : athleteId,
                                  plan_phase_id : ph.id,
                                  status        : sNow,
                                  comment       : phaseComment[key] || ''
                                })
                              }).catch(console.error);
                            }}
                            style={{ width: '100%', marginTop: 8 }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-right" />
    </div>
  );
}

export default DashboardAthlete;
