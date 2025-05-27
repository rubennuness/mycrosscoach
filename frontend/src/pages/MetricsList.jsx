import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import './Metrics.css';

export default function MetricsList() {
  const user       = JSON.parse(localStorage.getItem('user'));
  const navigate   = useNavigate();
  const [metrics , setMetrics ] = useState([]);
  const [pickerOn, setPickerOn] = useState(false);

  /* exercícios sugeridos – top-lifts mais frequentes ---------------- */
  const popularLifts = [
    'Back Squat',
    'Front Squat',
    'Deadlift',
    'Bench Press',
    'Strict Press',
    'Power Clean',
    'Snatch',
    'Clean & Jerk'
  ];

  /* carrega métricas existentes -------------------------------------- */
  useEffect(()=>{
    fetch(`https://mycrosscoach-production.up.railway.app/api/metrics/${user.id}`)
      .then(r=>r.json()).then(setMetrics);
  },[user.id]);

  /* cria nova métrica a partir do picker ----------------------------- */
  const createMetric = async (liftName)=>{
    try{
      const r = await fetch(
        `https://mycrosscoach-production.up.railway.app/api/metrics/${user.id}`,
        { method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({name:liftName}) });
      if(!r.ok) throw new Error();
      const created = await r.json();               // {id,name}
      setMetrics(m=>[...m, created]);               // UI optimista
      setPickerOn(false);
    }catch(e){
      alert('Error while adding metric');
    }
  };

  return(
    <div className="metrics-container">
      <BackButton />
      <h1>My Metrics</h1>

      <button className="btn-primary" onClick={()=>setPickerOn(true)}>
        + Add Metric
      </button>

      {/* ---------- picker modal ---------- */}
      {pickerOn && (
        <div className="picker-overlay" onClick={()=>setPickerOn(false)}>
          <div className="picker" onClick={e=>e.stopPropagation()}>
            <h2>Escolha o exercício</h2>
            <ul>
              {popularLifts.map(lift=>(
                <li key={lift} onClick={()=>createMetric(lift)}>
                  {lift}
                </li>
              ))}
              <li className="custom" onClick={()=>{
              
      const custom = prompt('Name of exercise');
      if(custom) createMetric(custom);
}}>Other</li>
            </ul>
          </div>
        </div>
      )}

      {/* ---------- lista de métricas ---------- */}
      <ul className="metric-list">
        {metrics.map(m=>(
          <li key={m.id} onClick={()=>navigate(`/metric/${m.id}`)}>
            {m.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
