// src/pages/PlanPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import calendarIcon from '../assets/calendar.png'; 
import BackButton from "../components/BackButton";
import Toast from '../components/Toast';
import './PlanPage.css';

function PlanPage() {
  const { athleteId }  = useParams();
  const navigate       = useNavigate(); 

  /* ---------- ►  NOVO  ◄ ---------- */
  const location       = useLocation();                 // veio da navegação?
  const navName        = location.state?.athleteName ?? '';
  const [athleteName, setAthleteName] = useState(navName);
  /* --------------------------------- */

  const [selectedDay, setSelectedDay] = useState('Segunda');
    /* ▼ NOVO  – segunda-feira da semana que estamos a planear */
  const today      = new Date();                       // ajuda no default
  const mondayIso  = new Date(today.setDate(
                     today.getDate() - ((today.getDay()||7) - 1))
                   ).toISOString().slice(0,10);        // YYYY-MM-DD
  const [weekStart, setWeekStart]       = useState(mondayIso);
  const [phases, setPhases]           = useState([{ title: '', text: '' }]);
  const [toastMessage, setToastMessage] = useState('');

  /* ①  Carrega o nome caso ainda não o tenhamos */
  useEffect(() => {
    if (athleteName || !athleteId) return;              // já temos → sai

    fetch(`https://mycrosscoach-production.up.railway.app/api/users/${athleteId}`)
      .then(r => r.ok ? r.json() : { name:'' })
      .then(data => setAthleteName(data.name ?? ''))
      .catch(()  => setAthleteName(''));
  }, [athleteId, athleteName]);
  /* ------------------------------------------- */
  /* ②  Carrega as fases sempre que
      • muda o dia OU
      • muda a semana OU
      • muda o atleta                                       */
useEffect(() => {
    if (!athleteId || !selectedDay) return;

    fetch(`https://mycrosscoach-production.up.railway.app/api/plans/day/${athleteId}/${selectedDay}?week=${weekStart}`)
      .then(res => res.json())
      .then(data => {
        if (data.phases) {
          setPhases(
            data.phases.length > 0 ? data.phases
                                   : [{ title: '', text: '' }]
          );
        } else {
          setPhases([{ title: '', text: '' }]);
        }
      })
      .catch(err => console.error(err));
  }, [athleteId, selectedDay, weekStart]);
  /* ------------------------------------------- */

  const handleAddPhase = () =>
    setPhases([...phases, { title: '', text: '' }]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const planData = {
            day_of_week     : selectedDay,
            week_start_date : weekStart,   /* NOVO */
            phases
          };

    fetch(`https://mycrosscoach-production.up.railway.app/api/plans/${athleteId}`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(planData)
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(()  => setToastMessage('Plano criado/atualizado!'))
      .catch(() => setToastMessage('Ocorreu um erro ao criar/atualizar o plano.'));
  };

  const handleCloseToast = () => setToastMessage('');

  return (
    <div className="planpage-container">
      <BackButton />                                 
      <div className="planpage-left">
        <div className="planpage-left-content">
          {/* ►--- título agora mostra o NOME, fallback #id ---◄ */}
          <h1 style={{ marginBottom: 20 }}>
            Plano de&nbsp;
            <span style={{ color:'#3498db' }}>
              {athleteName || `#${athleteId}`}
            </span>
          </h1>

          <form onSubmit={handleSubmit} className="plan-form">
            <div>
            <label style={{display:'block',marginBottom:6}}>
  Escolha a <strong>Semana</strong>:
</label>
<div className="week-picker-row">
  {/* selector que só permite segundas-feiras */}
  <input
    type="date"
    min={mondayIso}
    step="7"
    value={weekStart}
    onChange={e => {
      const d  = new Date(e.target.value);
      const wd = d.getDay() || 7;       // 1-Dom … 7-Sáb
      d.setDate(d.getDate() - wd + 1);  // força para 2ª-feira
      const monday = d.toISOString().slice(0,10);
      setWeekStart(monday);
      setPhases([{title:'',text:''}]);
    }}
    style={{width:'180px'}}
  />
{/* novo botão para abrir o calendário do atleta */}
  <button
    type="button"
    className="cal-btn"
    title="Abrir calendário"
    onClick={()=>navigate(`/calendar/${athleteId}`)}
  >
    <img src={calendarIcon} alt="Calendário" />
  </button>
</div>
              <label>Dia da semana:</label>
              <select value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}>
                <option>Segunda</option><option>Terça</option>
                <option>Quarta</option><option>Quinta</option>
                <option>Sexta</option><option>Sábado</option>
                <option>Domingo</option>
              </select>
            </div>

            <div>
              <h3>Fases do Treino</h3>
              {phases.map((phase, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <label>Título da Fase {i + 1}:</label>
                  <input
                    type="text"
                    value={phase.title}
                    onChange={e => {
                      const arr = [...phases];
                      arr[i].title = e.target.value;
                      setPhases(arr);
                    }}
                    style={{ width:'100%', marginBottom:6 }}
                  />

                  <label>Descrição:</label>
                  <textarea
                    rows="3"
                    value={phase.text}
                    onChange={e => {
                      const arr = [...phases];
                      arr[i].text = e.target.value;
                      setPhases(arr);
                    }}
                  />

                  {/* badge de estado se existir */}
                  {phase.status && phase.status !== 'pending' && (
                    <span className={`badge ${phase.status}`}
                          style={{ marginTop:6 }}>
                      {phase.status === 'completed' ? 'Concluído' : 'Falhou'}
                    </span>
                    )}
                     {phase.comment && (
                             <div className="comment-from-athlete" style={{marginTop:6, fontStyle:'italic'}}>
                               “{phase.comment}”
                             </div>
                          )}
                  
                </div>
              ))}

              <button type="button" onClick={handleAddPhase}
                      style={{ marginRight:10 }}>
                + Adicionar Fase
              </button>
            </div>

            <button type="submit" style={{ marginTop:10 }}>
              Guardar Plano
            </button>
          </form>

          <Toast message={toastMessage} onClose={handleCloseToast} />
        </div>
      </div>

      <div className="planpage-right" />
    </div>
  );
}

export default PlanPage;
