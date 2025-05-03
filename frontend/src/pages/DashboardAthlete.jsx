// src/pages/DashboardAthlete.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HamburgerMenu from '../components/HamburgerMenu';
import './Dashboard.css';

function DashboardAthlete() {
  const navigate           = useNavigate();
  const [daysOfWeek,setDaysOfWeek]       = useState([]);
  const [trainingPlans,setTrainingPlans] = useState({});
  const [selectedDay,setSelectedDay]     = useState(null);

  /* estado de cada fase: completed | missed | undefined  */
  const [phaseStatus,setPhaseStatus]     = useState({});        //  "Segunda-0" : 'completed'
  const [phaseComment,setPhaseComment]   = useState({});

  const user      = JSON.parse(localStorage.getItem('user'));
  const athleteId = user?.id;

  /* ---------- carrega plano ---------- */
  useEffect(()=>{
    if(!athleteId) return;
    fetch(`http://192.168.56.105:3000/api/training/week/${athleteId}`)
      .then(r=>r.json())
      .then(d=>{
        setDaysOfWeek(d.daysOfWeek);
        setTrainingPlans(d.plans);
      }).catch(console.error);
  },[athleteId]);

  /* ---------- progress ---------- */
  const phasesArray = selectedDay ? (trainingPlans[selectedDay] || []) : [];
  const completionRate = () => {
    if(!selectedDay || phasesArray.length===0) return 0;
    const comp = phasesArray.reduce((acc,_,idx)=>
      phaseStatus[`${selectedDay}-${idx}`]==='completed' ? acc+1 : acc ,0);
    return Math.round(comp / phasesArray.length * 100);
  };

  /* ---------- marca fase ---------- */
  const markPhase = (idx,status)=>{
    if(!selectedDay) return;
    const key   = `${selectedDay}-${idx}`;
    const curr  = phaseStatus[key];

    /* se clicar outra vez em Completed anulamos */
    const newStatus = (status==='completed' && curr==='completed')
                      ? undefined : status;

    setPhaseStatus(p=>({...p,[key]:newStatus}));

    /* opcional: guardar no backend
    fetch('http://.../api/progress',{ ... })
    */
  };

  const handleLogout = ()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return(
    <div className="dashboard-split-container">
      <div className="dashboard-left">
        <div className="dashboard-left-content">

          <div className="dash-header">
            <HamburgerMenu />
            <h2>Meu Plano de Treino (Atleta)</h2>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>

          <div className="days-list">
            {daysOfWeek.map(day=>(
              <button key={day}
                className={`day-button ${selectedDay===day?'active':''}`}
                onClick={()=>setSelectedDay(day)}>
                {day}
              </button>
            ))}
          </div>

          <div className="plan-details">
            {!selectedDay && <p>Selecione um dia para ver o plano.</p>}

            {selectedDay && (
              <>
                <h3 style={{marginBottom:10}}>{selectedDay}</h3>

                {/* barra de progresso */}
                {phasesArray.length > 0 && (
  <div className="progress-wrapper">
    {/* barra verde que cresce */}
    <div
      className="progress-bar"
      style={{ width: `${completionRate()}%` }}
    />
    
    {/* texto da percentagem (fica por cima) */}
    <span className="progress-text">
      {completionRate()}%
    </span>
  </div>
)}

                {phasesArray.length===0
                  ? <p>Nenhum plano para este dia.</p>
                  : (
                    <div className="phases-container">
                      {phasesArray.map((phaseObj,idx)=>{
                        const key  = `${selectedDay}-${idx}`;
                        const stat = phaseStatus[key];

                        return(
                          <div key={idx} className="phase-box">
                            <strong>{phaseObj.title || `Fase ${idx+1}`}</strong>
                            <pre style={{whiteSpace:'pre-wrap',marginTop:6}}>
                              {phaseObj.text || phaseObj}
                            </pre>

                            <div style={{marginTop:8}}>
                              <button
                                className={`status-btn ${stat==='completed'?'on completed':''}`}
                                onClick={()=>markPhase(idx,'completed')}
                              >
                                Completed
                              </button>

                              <button
                                className={`status-btn ${stat==='missed'?'on missed':''}`}
                                onClick={()=>markPhase(idx,'missed')}
                                style={{marginLeft:8}}
                              >
                                Missed
                              </button>
                            </div>

                            <textarea
                              className="comment-box"
                              rows={2}
                              placeholder="Comentário (opcional)"
                              value={phaseComment[key]||''}
                              onChange={e=>setPhaseComment(p=>({...p,[key]:e.target.value}))}
                              style={{width:'100%',marginTop:8}}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )
                }
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
