import React, { useEffect, useState } from 'react';
import { useParams }                  from 'react-router-dom';
import Calendar                   from 'react-calendar';   // npm i react-calendar
import { format, isSameDay }     from 'date-fns';
import BackButton                from '../components/BackButton';
import './CalendarPage.css';

export default function CalendarPage() {
  const { athleteId: paramId } = useParams(); // só virá para o coach

  const user        = JSON.parse(localStorage.getItem('user')) || {};
  const role        = user.role;              // 'athlete' ou 'coach'
  /* se for coach usa o :athleteId da rota; senão usa o próprio id  */
  const athleteId   = role === 'coach' ? Number(paramId) : user.id;

  const [selDate , setSelDate ] = useState(new Date());
  const [plan    , setPlan    ] = useState([]);   // phases do treino
  const [events  , setEvents  ] = useState([]);   // eventos desse atleta (todo o mês)

  /* 1️⃣  Carrega EVENTOS do atleta ao montar                          */
  useEffect(()=>{
    if(!athleteId) return;
    fetch(`https://mycrosscoach-production.up.railway.app/api/events/${athleteId}`)
      .then(r=>r.json())
      .then(setEvents)
      .catch(console.error);
  },[athleteId]);

  /* 2️⃣  Cada vez que o dia seleccionado muda: carrega o PLANO e filtra eventos do dia */
  useEffect(()=>{
    if(!athleteId || !selDate) return;

    (async () => {
      const ymd = format(selDate,'yyyy-MM-dd');

      // plano
      const p   = await fetch(`https://mycrosscoach-production.up.railway.app/api/plans/by-date/${athleteId}/${ymd}`)
                     .then(r=>r.json())
                     .catch(()=>({phases:[]}));
      setPlan(p.phases || []);

      // nada extra p/ eventos; já temos tudo no state events[]
    })();
  },[athleteId, selDate]);

  /* 3️⃣  Criação de um novo evento (coach apenas)                     */
  const handleAddEvent = async () => {
    const title = prompt('Título do evento (ex.: Prova 10 km)');
    if(!title) return;
    const note  = prompt('Nota opcional');
    const date  = format(selDate,'yyyy-MM-dd');

    await fetch(`https://mycrosscoach-production.up.railway.app/api/events/${athleteId}`,{
      method : 'POST',
      headers: { 'Content-Type':'application/json',
                 Authorization:`Bearer ${localStorage.getItem('token')}` },
      body   : JSON.stringify({title, note, date})
    });

    // actualiza lista local
    setEvents(ev => [...ev, {id:Date.now(), title, note, date}]);
  };

  /* 4️⃣  Render auxiliar para marcar dias com ponto                     */
  const tileContent = ({date,view})=>{
    if(view!=='month') return null;
    const hasEvent = events.some(e=>isSameDay(new Date(e.date),date));
    return hasEvent ? <span className="cal-dot">•</span> : null;
  };

  return (
    <div className="calendar-container">
      <BackButton label="Voltar" />

      <h1 className="cal-title">
        {role==='coach' ? 'Calendário do Atleta' : 'Meu Histórico de Treinos'}
      </h1>

      {role==='coach' && (
        <button className="btn-primary" onClick={handleAddEvent}>
          + Add Event
        </button>
      )}

      <Calendar
        onChange={setSelDate}
        value={selDate}
        locale="en-US"
        tileContent={tileContent}
      />

      <h2 className="cal-day-title">{format(selDate,'MMM dd yyyy')}</h2>

      {/* lista de eventos do dia -------------------------------------- */}
      {events.filter(e=>isSameDay(new Date(e.date),selDate)).length>0 && (
        <>
          <h3>Eventos:</h3>
          <ul className="cal-event-list">
            {events
              .filter(e=>isSameDay(new Date(e.date),selDate))
              .map(e=>(
               <li key={e.id}>
                 <strong>{e.title}</strong>
                 {e.note && <em> – {e.note}</em>}
               </li>
            ))}
          </ul>
        </>
      )}

      {/* plano / phases ------------------------------------------------ */}
      <h3 style={{marginTop:20}}>Plano de Treino:</h3>
      {plan.length===0
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
