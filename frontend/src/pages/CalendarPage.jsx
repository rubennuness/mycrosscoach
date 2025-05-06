// src/pages/CalendarPage.jsx
import React, { useState } from 'react';
import Calendar from 'react-calendar';      // npm i react-calendar
import { format } from 'date-fns';
import './CalendarPage.css';                // 👉 cria de forma semelhante às outras
import BackButton from '../components/BackButton';

function CalendarPage() {
  const user        = JSON.parse(localStorage.getItem('user')) || {};
  const athleteId   = user.id;
  const [selDate , setSelDate ] = useState(new Date());
  const [plan    , setPlan    ] = useState([]);

  /* quando o utilizador escolhe um dia -------------------------- */
  const onChange = async (date) => {
    setSelDate(date);
    setPlan([]);                             // limpa enquanto carrega

    /* BACK-END: cria rota GET /api/plans/by-date/:athleteId/:yyyy-mm-dd
       que devolve phases=[]
       (podes reutilizar week_start_date que tens na BD)           */
    const ymd = format(date,'yyyy-MM-dd');
    try {
      const r  = await fetch(`https://mycrosscoach-production.up.railway.app/api/plans/by-date/${athleteId}/${ymd}`);
      const d  = await r.json();
      setPlan(d.phases || []);
    } catch(e){ console.error(e); }
  };

  return (
    <div className="calendar-container">
      <BackButton label="Voltar" />

      <h1 className="cal-title">Meu Histórico de Treinos</h1>

      <Calendar
        onChange={onChange}
        value={selDate}
        locale="en-US"
      />

      <h2 className="cal-day-title">
        {format(selDate,'MMM dd yyyy')}
      </h2>

      {plan.length === 0
        ? <p>Sem treino registado para este dia.</p>
        : (
          <ul className="cal-phase-list">
            {plan.map((p,i)=>(
              <li key={i}>
                <strong>{p.title || `Fase ${i+1}`}</strong>
                <pre>{p.text}</pre>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

export default CalendarPage;
