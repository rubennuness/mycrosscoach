// src/pages/MetricsList.jsx
import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import BackButton from '../components/BackButton';
import './Metrics.css';

export default function MetricsList(){
  const user       = JSON.parse(localStorage.getItem('user'));
  const navigate   = useNavigate();
  const [metrics,setMetrics] = useState([]);

  useEffect(()=>{
    fetch(`https://mycrosscoach-production.up.railway.app/api/metrics/${user.id}`)
      .then(r=>r.json()).then(setMetrics);
  },[user.id]);

  const handleAdd = async ()=>{
    const name = prompt('Nome do exercício / métrica');
    if(!name) return;
    await fetch(`https://mycrosscoach-production.up.railway.app/api/metrics/${user.id}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name})
    });
    setMetrics(m=>[...m,{id:Date.now(),name}]);  // optimist-UI
  };

  return(
    <div className="metrics-container">
      <BackButton />
      <h1>Minhas Métricas</h1>

      <button className="btn-primary" onClick={handleAdd}>+ Add Metric</button>

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
