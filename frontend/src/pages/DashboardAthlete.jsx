// src/pages/DashboardAthlete.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import HamburgerMenu from '../components/HamburgerMenu';
import './Dashboard.css';

/* Mapeia o nome PT-BR → primeira letra EN  */
const dayInitial = {
  'Domingo': 'S',  // Sunday
  'Segunda': 'M',  // Monday
  'Terça'  : 'T',  // Tuesday
  'Quarta' : 'W',  // Wednesday
  'Quinta' : 'T',  // Thursday
  'Sexta'  : 'F',  // Friday
  'Sábado' : 'S'   // Saturday
};

const mondayISO = (d = new Date())=>{
  const wd = d.getDay() || 7;            // 1-Dom … 7-Sáb
  d.setDate(d.getDate() - wd + 1);       // recua até 2ª
  return d.toISOString().slice(0,10);    // YYYY-MM-DD
};

function DashboardAthlete() {
  const navigate                     = useNavigate();
  const [daysOfWeek,   setDaysOfWeek]    = useState([]);
  const [trainingPlans,setTrainingPlans] = useState({});
  const [selectedDay,  setSelectedDay]   = useState(null);
  const [headerDate,   setHeaderDate]    = useState('');

  /* progresso local */
  const [phaseStatus,  setPhaseStatus]   = useState({});  // ex.: "Segunda-0": 'completed'
  const [phaseComment, setPhaseComment]  = useState({});  // ex.: "Segunda-0": '…'

  const user      = JSON.parse(localStorage.getItem('user'));
  const athleteId = user?.id;
  const [weekStart] = useState(mondayISO());
  const [oneRM,setOneRM] = useState({});
  useEffect(()=>{
  fetch(`https://mycrosscoach-production.up.railway.app/api/metrics/${athleteId}`)
    .then(r=>r.json())
    .then(arr=>{
      const obj={}; arr.forEach(m=>obj[m.name]=m.max); setOneRM(obj);
    }).catch(()=>{});
  },[athleteId]);

  /* ▼ 1. CARREGA estrutura da semana (sem progresso) -------------------- */
  useEffect(() => {
    if (!athleteId) return;
    fetch(`https://mycrosscoach-production.up.railway.app/api/training/week/${athleteId}?week=${weekStart}`)
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

    fetch(`https://mycrosscoach-production.up.railway.app/api/plans/day/${athleteId}/${selectedDay}?week=${weekStart}`)
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
    /* ---------- util: devolve a Date para “Segunda”, “Terça”… ---------- */
      const getDateForDay = (dayName) => {
          const map = {
            'Domingo': 7, 'Segunda': 1, 'Terça': 2,
            'Quarta' : 3, 'Quinta' : 4, 'Sexta': 5, 'Sábado': 6
          };
    const today   = new Date();
    const todayIdx= today.getDay();            // 0-Dom … 6-Sáb
    const target  = map[dayName];
    if (target == null) return today;
    const diff    = target - todayIdx; // dias até chegar ao alvo
    const result  = new Date(today);
    result.setDate(today.getDate() + diff);
    return result;
  };

  /* ---------- JSX original (inalterado) ---------- */
  return (
    <div className="dashboard-split-container">
      <div className="dashboard-left">
        <div className="dashboard-left-content">
          <div className="dash-header">
            <HamburgerMenu />
            <h2>
              {/* mostra data se já escolheu um dia; senão o texto antigo */}
              { headerDate || 'Meu Plano de Treino' }
            </h2>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {/* botões dos dias */}
          <div className="days-list">
          {daysOfWeek.map(day => {
      /* ① já existe pelo menos 1 fase neste dia? */
      const hasPlan = (trainingPlans[day] || []).length > 0;

      return (
        <button
          key={dayInitial[day] || day.charAt(0)}
          className={`day-button ${selectedDay === day ? 'active' : ''}`}
          onClick={() => {
            /* se já estava aberto, volta a fechar (minimiza) */
   if (selectedDay === day) {
      setSelectedDay(null);      // “des-seleciona”
      setHeaderDate('');         // limpa data no header
    } else {
      setSelectedDay(day);       // abre
      const dt = getDateForDay(day);
      setHeaderDate(format(dt, 'MMM dd yyyy'));
    }
          }}
        >
          {dayInitial[day] || day.charAt(0)}
          {/* ● = tem treino | ○ = vazio */}
          <span className={`day-indicator ${hasPlan ? 'on' : 'off'}`}>
            {hasPlan ? '●' : '○'}
          </span>
        </button>
      );
    })}
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
                      const desc = typeof ph === 'string'
                 ? ph                            // plano antigo (string simples)
                 : (ph.text || '');              // plano novo (objecto)
                      return (
                        <div key={idx} className="phase-box">
                          <strong>{ph.title || `Fase ${idx+1}`}</strong>
{ph.percent && (
  <div style={{marginTop:4,fontStyle:'Arial'}}>
    {ph.sets || '?'} x {ph.reps || '?' }  {ph.percent}% { oneRM[ph.title]
      ? `→ ${Math.round(oneRM[ph.title] * ph.percent / 100)} kg`
      : '' }

  
  </div>
)}

<pre style={{ whiteSpace:'pre-wrap', marginTop:6 }}>
  {desc}
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
                            placeholder="Comentário"
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
                              fetch('https://mycrosscoach-production.up.railway.app/api/progress', {
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
