// src/pages/DashboardAthlete.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowNext from '../assets/left-arrow.png';
import arrowPrev from '../assets/left-arrow1.png';
import iconPlan     from '../assets/task.png';
import iconNotif    from '../assets/notification.png';
import iconProfile  from '../assets/resume.png';
import iconNutrition from '../assets/healthy-food.png';
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
  const [weekStart, setWeekStart] = useState(mondayISO());
  const weekLabel = `Week ${format(new Date(weekStart), 'MMMM d')}`;

  const fmt = n =>
  (n === null || n === undefined || n === '')
    ? '?'
    : (parseFloat(n) % 1 === 0
        ? parseInt(n, 10).toString()      
        : parseFloat(n).toFixed(0));      


        const token = localStorage.getItem('token');

/* fetch que acrescenta o token e redirecciona se 401 */
const api = (url, opt = {}) => {
  const opts = {
    ...opt,
    headers: {
      ...(opt.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  return fetch(url, opts).then(res => {
    if (res.status === 401) {          // token expirou
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');              // redirecciona
      throw new Error('Unauthorized'); // interrompe resto da promise
    }
    return res;
  });
};
/* helpers p/ avançar / recuar 7 dias ------------------------------- */
const shiftWeek = (delta) => {               // delta = ±7 (em dias)
  const d = new Date(weekStart);
  d.setDate(d.getDate() + delta);
  setWeekStart(mondayISO(d));                // força para 2.ª feira
  setSelectedDay(null); 
  setHeaderDate('');                     // limpa dia activo
  setTrainingPlans({});                      // evita “fantasma” da semana ant.
  setPhaseStatus({});
  setPhaseComment({});
};
  const [oneRM,setOneRM] = useState({});
  useEffect(()=>{
  api(`https://mycrosscoach-production.up.railway.app/api/metrics/${athleteId}`)
    .then(r=>r.json())
    .then(arr=>{
      const obj={}; arr.forEach(m=>obj[m.name]=m.max); setOneRM(obj);
    }).catch(()=>{});
  },[athleteId]);

  /* ▼ 1. CARREGA estrutura da semana (sem progresso) -------------------- */
  useEffect(() => {
    if (!athleteId) return;
    api(`https://mycrosscoach-production.up.railway.app/api/training/week/${athleteId}?week=${weekStart}`)
      .then(r => r.json())
      .then(d => {
        setDaysOfWeek(d.daysOfWeek);
        setTrainingPlans(d.plans);        
      })
      .catch(console.error);
  }, [athleteId, weekStart]);

  /* ▼ 2. CARREGA progresso quando o dia muda --------------------------- */
  useEffect(() => {
    if (!athleteId || !selectedDay) return;

    api(`https://mycrosscoach-production.up.railway.app/api/plans/day/${athleteId}/${selectedDay}?week=${weekStart}`)
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
  }, [athleteId, selectedDay, weekStart]);
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

    api('https://mycrosscoach-production.up.railway.app/api/progress', {
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
/* devolve a Date do dia da semana dentro de *weekStart* (segunda-feira ISO) */
const getDateForDay = (dayName, mondayStr) => {
  const offset = {                    // distância em dias a partir de segunda
    'Segunda': 0, 'Terça': 1, 'Quarta': 2,
    'Quinta' : 3, 'Sexta': 4, 'Sábado': 5, 'Domingo': 6
  }[dayName];
  if (offset == null) return new Date(mondayStr);
  const d = new Date(mondayStr);      // base = semana actualmente seleccionada
  d.setDate(d.getDate() + offset);
  return d;
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
              { headerDate || weekLabel }
            </h2>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
          <div className="week-arrows-row">
  <button className="week-arrow" onClick={() => shiftWeek(-7)}>
    <img src={arrowPrev} alt="prev week" />
  </button>

  <button className="week-arrow" onClick={() => shiftWeek(+7)}>
    <img src={arrowNext} alt="next week" />
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
      const dt = getDateForDay(day, weekStart);
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
                      /* ► cálculo da(s) carga(s) ------------------- */
                      const rm   = oneRM[ph.title];
                      let  loadTxt = '';
                      if (rm && (ph.pLow || ph.pHigh)) {
                        const l = Math.round(rm * (ph.pLow || ph.pHigh) / 100);
                        if (ph.pHigh && ph.pHigh !== ph.pLow) {
                          const h = Math.round(rm * ph.pHigh / 100);
                          loadTxt = `→ ${l}-${h} kg`;
                        } else {
                          loadTxt = `→ ${l} kg`;
                        }
                      }

                      return (
                        
                        <div key={idx} className="phase-box">
                          <strong>{ph.title || `Fase ${idx+1}`}</strong>
{(ph.pLow || ph.pHigh) && (
  <div style={{marginTop:4}}>
    {ph.sets || '?'} x {ph.reps || '?'}&nbsp;
    {fmt(ph.pLow)}–{fmt(ph.pHigh)}%
    {loadTxt && (' ' + loadTxt)}
  </div>
)}
{Array.isArray(ph.ranges) && ph.ranges.map((r,i) => {
   const rm2 = oneRM[ph.title];
   let  kg   = '';
   if (rm2 && (r.pLow || r.pHigh)) {
     const l = Math.round(rm2 * (r.pLow || r.pHigh) / 100);
     kg = ` → ${l}${r.pHigh && r.pHigh !== r.pLow ? '-'+
          Math.round(rm2 * r.pHigh / 100) : ''} kg`;
   }
   return (
     <div key={i} style={{marginTop:2}}>
    {r.sets} x {r.reps}  {fmt(r.pLow)}-{fmt(r.pHigh)}%{kg}
     </div>
   );
 })}
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
                              api('https://mycrosscoach-production.up.railway.app/api/progress', {
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
          <nav className="bottom-nav">
  <button
    className={!selectedDay ? 'active' : ''}
    onClick={() => setSelectedDay(null)}
  >
    <img src={iconPlan} alt="" className="nav-icon" />
    Plan
  </button>

  <button onClick={() => navigate('/notifications')}>
    <img src={iconNotif} alt="" className="nav-icon" />
    Notifications
  </button>

  <button onClick={() => navigate('/profile')}>
    <img src={iconProfile} alt="" className="nav-icon" />
    Profile
  </button>

  <button onClick={() => navigate('/nutrition')}>
    <img src={iconNutrition} alt="" className="nav-icon" />
    Nutrition
  </button>
</nav>
        </div>
      </div>


      <div className="dashboard-right" />
    </div>
  );
}

export default DashboardAthlete;
