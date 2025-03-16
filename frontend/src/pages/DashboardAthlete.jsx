import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HamburgerMenu from '../components/HamburgerMenu';
import './Dashboard.css';

function DashboardAthlete() {
  const navigate = useNavigate();
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const athleteId = user?.id;

  useEffect(() => {
    if (!athleteId) return;

    fetch(`http://192.168.56.105:3000/api/training/week/${athleteId}`)
      .then(res => res.json())
      .then(data => {
        setDaysOfWeek(data.daysOfWeek);
        setTrainingPlans(data.plans);
      })
      .catch(err => console.error(err));
  }, [athleteId]);

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const phasesArray = selectedDay ? trainingPlans[selectedDay] || [] : [];

  /* Guarda localmente o estado  (phaseIdx→ 'completed' | 'missed' | null)  */
 const [phaseStatus,setPhaseStatus] = useState({});    // { 'Segunda-0':'completed', ... }

   const markPhase = (idx,status)=>{
      if(!selectedDay) return;
      const key = `${selectedDay}-${idx}`;
      setPhaseStatus(prev=>({...prev,[key]:status}));
  
      // Chama API p/ gravar
      fetch('http://192.168.56.105:3000/api/progress',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          athlete_id : athleteId,
          plan_phase_id : phasesArray[idx].id,   // precisa vir do backend, vê nota abaixo
          status
        })
      }).catch(console.error);
    };

  return (
    <div className="dashboard-split-container">
      {/* Lado esquerdo escuro */}
      <div className="dashboard-left">
        <div className="dashboard-left-content">

          <div className="dash-header">
            <HamburgerMenu />
            <h2>Meu Plano de Treino (Atleta)</h2>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>

          <div className="days-list">
            {daysOfWeek.map((day) => (
              <button
                key={day}
                className={`day-button ${selectedDay === day ? 'active' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="plan-details">
            {selectedDay ? (
              <>
                <h3 style={{ marginBottom: '10px' }}>{selectedDay}</h3>
                {phasesArray.length > 0 ? (
      <div>
        {phasesArray.map((phaseObj, idx) => {
           const key   = `${selectedDay}-${idx}`;
           const stat  = phaseStatus[key];        // completed | missed | undefined
           return (
            <div key={idx} className="phase-box">
                          <strong>{phaseObj.title || `Fase ${idx+1}`}</strong>
                          <pre style={{whiteSpace:'pre-wrap',marginTop:6}}>
                             {phaseObj.text}
                           </pre>

               <div style={{marginTop:8}}>
                 <button
                   className={`status-btn ${stat==='completed' ? 'on completed' : ''}`}
                   onClick={()=>markPhase(idx,'completed')}
                 >Completed</button>

                 <button
                   className={`status-btn ${stat==='missed' ? 'on missed' : ''}`}
                   onClick={()=>markPhase(idx,'missed')}
                   style={{marginLeft:8}}
                 >Missed</button>
               </div>
             </div>
           );
         })}
      </div>
                ) : (
                  <p>Nenhum plano para este dia.</p>
                )}
              </>
            ) : (
              <p>Selecione um dia para ver o plano.</p>
            )}
          </div>

        </div>
      </div>

      {/* Lado direito: imagem de fundo */}
      <div className="dashboard-right"></div>
    </div>
  );
}

export default DashboardAthlete;