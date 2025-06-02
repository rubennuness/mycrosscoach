// src/pages/PlanPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import calendarIcon from '../assets/calendar.png';
import BackButton   from '../components/BackButton';
import Toast        from '../components/Toast';
import './PlanPage.css';

export default function PlanPage() {
  const { athleteId } = useParams();
  const navigate      = useNavigate();
  const location      = useLocation();

  const navName = location.state?.athleteName ?? '';
  const [athleteName,setAthleteName] = useState(navName);

  /* ───────── estado principal ───────── */
  const [selectedDay,setSelectedDay] = useState('Segunda');

  const today     = new Date();
  const mondayIso = new Date(today.setDate(today.getDate() - ((today.getDay()||7) - 1)))
                     .toISOString().slice(0,10);   // YYYY-MM-DD
  const [weekStart,setWeekStart]    = useState(mondayIso);

  const [phases , setPhases ] = useState([{
    title:'', text:'', sets:'', reps:'', percent:'', ranges:[]
  }]);
  const [metrics,setMetrics]       = useState([]);
  const [toast , setToast ]        = useState('');

  /* ───────── auxiliares ───────── */
  const handleToast = msg => { setToast(msg); setTimeout(()=>setToast(''),5000); };

  /* ───────── efeitos ───────── */

  // carrega métricas (1RM)
  useEffect(()=>{
    if(!athleteId) return;
    fetch(`https://mycrosscoach-production.up.railway.app/api/metrics/${athleteId}`)
      .then(r=>r.json()).then(setMetrics).catch(()=>{});
  },[athleteId]);

  // carrega nome do atleta (se vier vazio)
  useEffect(()=>{
    if(athleteName || !athleteId) return;
    fetch(`https://mycrosscoach-production.up.railway.app/api/users/${athleteId}`)
      .then(r=>r.ok?r.json():{name:''})
      .then(d=>setAthleteName(d.name||''));
  },[athleteId,athleteName]);


  const fmtPercent = v =>
  v === null || v === undefined || v === ''
    ? ''
    : parseFloat(v).toString();  
  // carrega fases sempre que muda dia / semana / atleta
  useEffect(()=>{
    if(!athleteId||!selectedDay) return;
    fetch(`https://mycrosscoach-production.up.railway.app/api/plans/day/${athleteId}/${selectedDay}?week=${weekStart}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.phases && d.phases.length) setPhases(
     d.phases.map(p => ({
       ...p,
       pLow : fmtPercent(p.pLow),
       pHigh: fmtPercent(p.pHigh),
       ranges: (p.ranges || []).map(r => ({
         ...r,
         pLow : fmtPercent(r.pLow),
         pHigh: fmtPercent(r.pHigh)
       }))
     }))
   );
        else setPhases([{title:'',text:'',sets:'',reps:'',percent:'',ranges:[]}]);
      })
      .catch(console.error);
  },[athleteId,selectedDay,weekStart]);

  

  /* ───────── handlers ───────── */

  const addPhase   = () =>
    setPhases(p=>[...p,{title:'',text:'',sets:'',reps:'',percent:'',ranges:[]}]);

  const addRange = i => {
    const a = [...phases];
    a[i].ranges.push({ sets:'', reps:'', pLow:'', pHigh:'' });
    setPhases(a);
  };

  const savePlan   = async e =>{
    e.preventDefault();
    const body={
      day_of_week     : selectedDay,
      week_start_date : weekStart,
      phases
    };
    try{
      const r = await fetch(
        `https://mycrosscoach-production.up.railway.app/api/plans/${athleteId}`,
        {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(!r.ok) throw new Error();
      handleToast('Plano criado/atualizado!');
    }catch{ handleToast('Erro ao gravar'); }
  };

  const renderTitle = (ph,idx)=>(
    <div style={{display:'flex',gap:8}}>
      <input
        value={ph.title}
        placeholder="Ex.: Snatch"
        onChange={e=>{
          const a=[...phases]; a[idx].title=e.target.value; setPhases(a);
        }}
        list={`dl-ex-${idx}`} style={{flex:1}}
      />
      <datalist id={`dl-ex-${idx}`}>
        {metrics.map(m=><option key={m.name} value={m.name}/>)}
      </datalist>
    </div>
  );

  /* ───────── render ───────── */
  return (
    <div className="planpage-container">
      <BackButton/>
      <div className="planpage-left">
        <div className="planpage-left-content">

          {/* ---------- cabeçalho idêntico ---------- */}
          <h1 style={{marginBottom:20}}>
            Plano de&nbsp;<span style={{color:'#3498db'}}>
              {athleteName||`#${athleteId}`}
            </span>
          </h1>

          <form onSubmit={savePlan} className="plan-form">
            {/* ---------- Semana + dia exactamente iguais ---------- */}

            <h3>Fases do treino</h3>

            {phases.map((ph,i)=>(
              <div key={i} className="phase-card">
                <label>Exercício {i+1}:</label>
                {renderTitle(ph,i)}

                {/* bloco principal ------------------------------------------------ */}
                <div className="mini-row">
                  <input type="number" min="0" placeholder="Sets"
                         value={ph.sets||''}
                         onChange={e=>{
                           const a=[...phases];a[i].sets=e.target.value;setPhases(a);
                         }}/>
                  <input type="number" min="0" placeholder="Reps"
                         value={ph.reps||''}
                         onChange={e=>{
                           const a=[...phases];a[i].reps=e.target.value;setPhases(a);
                         }}/>
                  <input type="number" min="0" max="100" placeholder="% de"
                         value={ph.pLow||''}
                         onChange={e=>{
                           const a=[...phases];a[i].pLow=e.target.value;setPhases(a);
                         }}/>
                  <input type="number" min="0" max="100" placeholder="% até"
                         value={ph.pHigh||''}
                         onChange={e=>{
                           const a=[...phases];a[i].pHigh=e.target.value;setPhases(a);
                         }}/>
                  {/* botão + */}
                  {ph.ranges.length === 0 && (
    <button type="button" className="plus-btn" onClick={() => addRange(i)}>
      +
    </button>
  )}
                </div>

                {/* blocos extra ---------------------------------------------------- */}
                {ph.ranges.map((r,j)=>(
                  <div key={j} className="mini-row sub">
                    <input type="number" min="0" placeholder="Sets"
                           value={r.sets||''}
                           onChange={e=>{
                             const a=[...phases];a[i].ranges[j].sets=e.target.value;setPhases(a);
                           }}/>
                    <input type="number" min="0" placeholder="Reps"
                           value={r.reps||''}
                           onChange={e=>{
                             const a=[...phases];a[i].ranges[j].reps=e.target.value;setPhases(a);
                           }}/>
                    <input type="number" min="0" max="100" placeholder="% de"
                           value={r.pLow||''}
                           onChange={e=>{
                             const a=[...phases];a[i].ranges[j].pLow=e.target.value;setPhases(a);
                           }}/>
                    <input type="number" min="0" max="100" placeholder="% até"
                           value={r.pHigh||''}
                           onChange={e=>{
                             const a=[...phases];a[i].ranges[j].pHigh=e.target.value;setPhases(a);
                           }}/>
                           {j === ph.ranges.length - 1 && (
      <button
        type="button"
        className="plus-btn"
        onClick={() => addRange(i)}
      >
        +
      </button>
    )}
                  </div>
                ))}

                <textarea rows={3} placeholder="Notas"
                          value={ph.text||''}
                          onChange={e=>{
                            const a=[...phases];a[i].text=e.target.value;setPhases(a);
                          }}/>

                {/* ▼ feedback do atleta ------------------------- */}
                {ph.status && ph.status !== 'pending' && (
                  <span
                    className={`badge ${ph.status}`}
                    style={{ marginTop: 6 }}
                  >
                    {ph.status === 'completed' ? 'Completed' : 'Missed'}
                  </span>
                )}

                {ph.comment && (
                  <div
                    className="comment-from-athlete"
                    style={{ marginTop: 6, fontStyle: 'italic' }}
                 >
                    “{ph.comment}”
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={addPhase} style={{marginRight:10}}>
              + Add Fase
            </button>

            <button type="submit" style={{marginTop:10}}>
              Save Plan
            </button>
          </form>

          <Toast message={toast} onClose={()=>setToast('')}/>
        </div>
      </div>
    </div>
  );
}
