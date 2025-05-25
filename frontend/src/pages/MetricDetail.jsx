// src/pages/MetricDetail.jsx
import React,{useEffect,useState} from 'react';
import {useParams} from 'react-router-dom';
import BackButton from '../components/BackButton';
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts';
import './Metrics.css';

export default function MetricDetail(){
  const {metricId}      = useParams();
  const [meta,setMeta]  = useState({name:''});
  const [results,setRes]= useState([]);

  // carrega nome + resultados
  useEffect(()=>{
    fetch(`https://mycrosscoach-production.up.railway.app/api/metrics/view/${metricId}`)
      .then(r=>r.json())
      .then(({metric,results})=>{
        setMeta(metric);
        setRes(results.sort((a,b)=>new Date(a.date)-new Date(b.date)));
      });
  },[metricId]);

  const addResult = async ()=>{
    const val   = parseFloat(prompt('Valor (kg, reps, etc.)'));
    if(isNaN(val)) return;
    await fetch(`https://mycrosscoach-production.up.railway.app/api/metrics/result/${metricId}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({value:val})
    });
    setRes(r=>[...r,{value:val,date:new Date().toISOString()}]);
  };

  return(
    <div className="metrics-container">
      <BackButton />
      <h2>{meta.name}</h2>

      <button className="btn-primary" onClick={addResult}>Add Result</button>

      {/* gráfico */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={results}>
          <Line type="monotone" dataKey="value" stroke="#39f" dot />
          <XAxis dataKey={(d)=>new Date(d.date).toLocaleDateString()} />
          <YAxis />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>

      <h3>Results:</h3>
      <ul className="result-list">
        {results.slice().reverse().map((r,i)=>(
          <li key={i}>
            <span>{r.value}</span>
            <span>{new Date(r.date).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
