// src/pages/Timers.jsx
import React, { useState, useEffect, useRef } from 'react';
import BackButton from '../components/BackButton';
import './Timers.css';

const fmt = (t)=>String(t).padStart(2,'0');

export default function Timers(){
  /* ---------- state comum ---------- */
  const [mode,setMode]           = useState('amrap');
  const [running,setRunning]     = useState(false);
  const [paused ,setPaused ]     = useState(false);
  const [resting, setResting] = useState(false);   // FOR-TIME em descanso
  const [display,setDisplay]     = useState('00:00');
  const [round,setRound]         = useState(1);
  const intervalRef              = useRef(null);
  const restRef     = useRef(null);
  const secsRef    = useRef(0); 
  const prepLeftRef = useRef(0);
  const runWorkoutRef = useRef(()=>{});
  const isPrep   = display.startsWith('START IN');      // estamos nos 10 s iniciais?
  const isRest  = display.startsWith('REST');
  const seconds  = isPrep ? display.split(' ').pop()    // "2"
                        : display;                    // "09:58"
  const ringLabel = isPrep
  ? 'GET READY'
  : isRest ? 'REST' : 'REMAINING TIME';
  const toSec = v =>{
  if (typeof v === 'number') return v;           // continua a funcionar c/ nº
  if (!v.includes(':'))      return +v * 60;     // "2" → 120 s (minutos)
  const [m,s] = v.split(':').map(Number);        // "1:30" → 1 e 30
  return m*60 + (s||0);
};
const secondsShown = isPrep
  ? seconds                                   // 10…1
  : isRest
      ? display.split(' ')[1].replace('s','') // "REST 27s" ➜ "27"
      : display;                              // relógio normal
const fmtMS = s => `${fmt(Math.floor(s/60))}:${fmt(s%60)}`; // 95 → "01:35"
const asClock = s => s >= 60 ? fmtMS(s) : fmt(s);

  /* ---------- inputs ---------- */
  const [amrapMin,setAmrapMin]   = useState(10);
  const [amrapSets,setAmrapSets] = useState(1);   // ← nº de séries
  const [amrapRest,setAmrapRest] = useState('30');
  const [amrapCnt,setAmrapCnt]   = useState(0);
  const [ftRounds,setFtRounds]   = useState(5);      // FOR TIME – nº rondas alvo
  const [ftRest,setFtRest]       = useState(30);     // FOR TIME – descanso (s)
  const [ftCur,setFtCur]         = useState(1);      // ronda actual

  const [emomMin,setEmomMin]     = useState(12);
  const [emomStep,setEmomStep]   = useState('60');
  const [tabWork,setTabWork]     = useState(20);
  const [tabRest,setTabRest]     = useState(10);
  const [tabRounds,setTabRounds] = useState(8);
  const [prog, setProg] = useState(1);   // 1 = círculo cheio
  const totalRef        = useRef(1);     // duração (seg) do bloco actual
  /* sempre que muda o modo, limpa timers pendentes
   (evita contagens “fantasma”)                        */

   
useEffect(()=>{
    stop();
    setDisplay('00:00');
    setRound(1);
    setFtCur(1);
    setAmrapCnt(0);
  }, [mode]);
  /* ---------- helpers ---------- */
  const stop = ()=>{
      clearInterval(intervalRef.current);
      clearInterval(restRef.current);
      intervalRef.current = restRef.current = null;
      setRunning(false);
      setPaused(false);
      setResting(false);
    };


    const pause = () => {
        if (!running) return;
        clearInterval(intervalRef.current);
        clearInterval(restRef.current);
        intervalRef.current = restRef.current = null;
        setPaused(true);
        //setRunning(false);      // continua “running”, mas flag de pausa = true
      };

  const start = (skipPrep = false) => {
    stop();
    setRunning(true);
    setPaused(false);
    if (skipPrep) {
      runWorkout();          // usa a mesma função
      return;
    }
    let secs, left, work = true;

  /* ──────── 1. Pré-countdown de 10 s ──────── */
  let prep = 10;
  setDisplay(`START IN ${prep}`);
  setProg(1);

  intervalRef.current = setInterval(() => {
    if (--prep > 0) {
      prepLeftRef.current = prep;
      setDisplay(`START IN ${prep}`);
      setProg(prep / 10);
      return;
    }

    /* terminou o “pré-start” → arranca o modo real */
    clearInterval(intervalRef.current);

    runWorkout();
  }, 1000);

  /* ──────── função que contém toda a lógica anterior ──────── */
  function runWorkout () {
  
    /* ---------- AMRAP ---------- */
    if (mode === 'amrap') {
  let setsLeft   = amrapSets;
  let phase      = 'work';          // 'work' | 'rest'
  secsRef.current = amrapMin * 60;  // contagem inicial
  totalRef.current = secsRef.current;
  setProg(1);
  setAmrapCnt(0);
  setDisplay(`${fmt(amrapMin)}:00`);

  intervalRef.current = setInterval(() => {
    secsRef.current--;
    setDisplay(`${fmt(Math.floor(secsRef.current/60))}:${fmt(secsRef.current%60)}`);
    setProg(secsRef.current / totalRef.current);

    if (secsRef.current === 0) {
      if (phase === 'work') {
        /* terminou um AMRAP */
        setAmrapCnt(c => c + 1);
        setsLeft--;
        if (setsLeft === 0) { stop(); return; }
        /* passa ao REST */
        phase            = 'rest';
        secsRef.current  = toSec(amrapRest);
        totalRef.current = secsRef.current;
        setDisplay(`REST ${fmtMS(secsRef.current)}`);
      } else {
        /* terminou REST → próximo AMRAP */
        phase            = 'work';
        secsRef.current  = amrapMin * 60;
        totalRef.current = secsRef.current;
      }
      setProg(1);
    }
  }, 1000);
  return;
}

    /* ---------- FOR TIME ---------- */
    if(mode==='forTime'){
        secsRef.current = 0;
        totalRef.current = 60;        // enche a cada minuto
      setProg(0);
      setDisplay('00:00');
      intervalRef.current = setInterval(() => {
          secsRef.current++;
          setProg((secsRef.current % 60) / 60);
         setDisplay(`${fmt(Math.floor(secsRef.current/60))}:${fmt(secsRef.current%60)}`);
      },1000);
      return;
    }

    /* ---------- EMOM ---------- */
      /* ---------- EMOM ---------- */
if (mode === 'emom') {
  const totalSecs   = emomMin  * 60;   // duração total
  const step        = toSec(emomStep);       // segundos por ronda
  let   leftInStep  = step;            // contador interno
  let   elapsed     = 0;               // tempo decorrido
  let   currentRnd  = 1;

  secsRef.current   = totalSecs;
  totalRef.current  = step;
  setRound(currentRnd);
  setProg(1);
  setDisplay(step >= 60 ? fmtMS(step) : fmt(step));

  intervalRef.current = setInterval(() => {
    secsRef.current--;
    leftInStep--;
    elapsed++;

    /* actualiza anel & display */
    setProg(leftInStep / step);
    setDisplay(leftInStep >= 60 ? fmtMS(leftInStep) : fmt(leftInStep));


    /* fim de uma ronda */
    if (leftInStep === 0) {
      currentRnd += 1;
      if (elapsed >= totalSecs) { stop(); return; }
      setRound(currentRnd);
      leftInStep = step;
      setProg(1);
    }
  }, 1000);

  return;
}

    /* ---------- TABATA ---------- */
    if(mode==='tabata'){
        const w = toSec(tabWork);
 const r = toSec(tabRest);
 totalRef.current = w;
 secsRef.current  = left = w;
        
        setProg(1);
      setRound(1);
      setDisplay(asClock(left)); 
      intervalRef.current=setInterval(()=>{
        if (--secsRef.current < 0){
          if(work){ work=false; left=r; }
          else{
            work=true; setRound(r=>r+1);
            if(round>=tabRounds){stop();return;}
            secsRef.current = work ? w : r;
          }
        }
        setDisplay(asClock(secsRef.current));
      },1000);
    }
  };
  runWorkoutRef.current = runWorkout;
  }
  const resume = () => {
    if (!paused) return;
  
    setPaused(false);
    setRunning(true);
    if (display.startsWith('START IN')) {
   let prep = prepLeftRef.current || 10;
   setProg(prep / 10);

   intervalRef.current = setInterval(() => {
     if (--prep > 0) {
       prepLeftRef.current = prep;
       setDisplay(`START IN ${prep}`);
       setProg(prep / 10);
     } else {
       clearInterval(intervalRef.current);
       runWorkoutRef.current();      // entra no treino sem reiniciar tudo
     }
   }, 1000);

   return;                           // sai antes dos restantes blocos
 }
    /* recria o setInterval só com o tempo que ainda falta (secsRef.current) */
    if (mode === 'amrap') {
      intervalRef.current = setInterval(() => {
        if (--secsRef.current < 0) { stop(); return; }
        setDisplay(`${fmt(Math.floor(secsRef.current/60))}:${fmt(secsRef.current%60)}`);
      }, 1000);
      return;
    }
  
    if (mode === 'forTime') {
      intervalRef.current = setInterval(() => {
        secsRef.current++;
        setDisplay(`${fmt(Math.floor(secsRef.current/60))}:${fmt(secsRef.current%60)}`);
      }, 1000);
      return;
    }
  
    if (mode === 'emom') {
  const step = toSec(emomStep);                 // 30, 45, 90, …
  intervalRef.current = setInterval(() => {
    secsRef.current--;
    if (secsRef.current < 0){ stop(); return; }

    const leftInStep = secsRef.current % step || step;
    if (leftInStep === step) setRound(r => r + 1);

    setProg(leftInStep / step);
    setDisplay(leftInStep >= 60 ? fmtMS(leftInStep) : fmt(leftInStep));
  }, 1000);
  return;
}
  
    if (mode === 'tabata') {
      const w = toSec(tabWork);
 const r = toSec(tabRest);
 let work = secsRef.current !== r;
      intervalRef.current = setInterval(() => {
        secsRef.current--;
        if (secsRef.current < 0) {
          if(work){ work=false; secsRef.current = r; }
          else {
            work = true; setRound(r => r + 1);
            if (round >= tabRounds) { stop(); return; }
            secsRef.current = w;
          }
        }
        setDisplay(fmt(secsRef.current));
      }, 1000);
    }
  };
  useEffect(()=>()=>clearInterval(intervalRef.current),[]);


  /* ---------- UI ---------- */
  return(
    <div className="timers-container">
      <BackButton />                                   {/* ⬅️ NOVO */}
      <h1>Timers</h1>

      {/* tabs */}
      <div className="mode-tabs">
        {['amrap','forTime','emom','tabata'].map(m=>(
          <button key={m}
                  className={mode===m?'tab active':'tab'}
                  onClick={()=>{setMode(m);stop();setDisplay('00:00')}}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      
      {/* configuração */}
      <div className="config">
        {mode==='amrap' && (
          <>
    <label>Séries:
      <input type="number" min="1" value={amrapSets}
             onChange={e=>setAmrapSets(+e.target.value)}/>
    </label>

    <label>Min/AMRAP:
      <input type="number" min="1" value={amrapMin}
             onChange={e=>setAmrapMin(+e.target.value)}/>
    </label>

    <label>Rest entre séries (m:s):
  <input type="text"  value={amrapRest}
        onChange={e=>setAmrapRest(e.target.value.replace(/[^0-9:]/g,''))}/>
    </label>
  </>
        )}

        {mode==='forTime' && (
          <>
            <label>Rondas alvo:
              <input type="number" min="1" value={ftRounds}
                     onChange={e=>setFtRounds(+e.target.value)}/>
            </label>
            <label>Rest entre rondas (m:s):
          <input type="text"  value={ftRest}
        onChange={e=>setFtRest(e.target.value.replace(/[^0-9:]/g,''))}/>
            </label>
          </>
        )}

        {mode==='emom' && (
          <>
    <label>Total (min):
      <input type="number" min="1" value={emomMin}
             onChange={e=>setEmomMin(+e.target.value)}/>
    </label>
    <label>Intervalo (m:s):
  <input type="text" value={emomStep}
         onChange={e=>setEmomStep(e.target.value)}/>
    </label>
  </>
        )}

        {mode==='tabata' && (
          <>
            <label>Work (m:s):
            <input type="text"  value={tabWork}
        onChange={e=>setTabWork(e.target.value.replace(/[^0-9:]/g,''))}/>
            </label>
            <label>Rest (m:s):
            <input type="text"  value={tabRest}
        onChange={e=>setTabRest(e.target.value.replace(/[^0-9:]/g,''))}/>
            </label>
            <label>Rounds:
              <input type="number" min="1" value={tabRounds}
                     onChange={e=>setTabRounds(+e.target.value)}/>
            </label>
          </>
        )}
      </div>

      {/* display */}
      <div className={`timer-display ${paused ? 'paused' : ''}`}></div>
      <div className="ring-wrapper">
  <svg className="ring" width="240" height="240">
    {/* fundo cinza */}
    <circle
      className="ring-bg"
      r="110" cx="120" cy="120"
    />
    {/* arco activo (stroke-dashoffset é calculado em runtime) */}
    <circle
      className="ring-progress"
      r="110" cx="120" cy="120"
      style={{ strokeDashoffset: 690 * (1 - prog) }}   /* 690 ≈ 2π·110 */
    />
  </svg>

  {/* texto sobreposto */}
  <div className="ring-center">
    <span className="label">{ringLabel}</span>
    <span className="time">{secondsShown}</span>
    <span className="sub">MIN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SEC</span>
  </div>
</div>
{!isPrep && (
  <div className="timer-info">
    {mode==='amrap' && (
      <span className="round">Rondas:&nbsp;{amrapCnt}</span>)}
    {mode==='forTime' && (
      <span className="round">
        Ronda&nbsp;{ftCur}/{ftRounds}
      </span>
    )}
    {mode==='emom'  && <span className="round">Min&nbsp;{round}</span>}
    {mode==='tabata'&& <span className="round">Ronda&nbsp;{round}</span>}
  </div>
)}
      {/* botões extra AMRAP / FOR TIME */}
      {mode==='amrap' && running && (
        <button
          className="btn secondary"
          style={{marginBottom:12}}
          onClick={()=>setAmrapCnt(c=>c+1)}>
          +1 Ronda
        </button>
      )}

      {mode==='forTime' && running && !isPrep && !resting && (
        <button
          className="btn secondary"
          style={{marginBottom:12}}
          onClick={()=>{
            if(ftCur>=ftRounds){ stop(); return; }
            setFtCur(c=>c+1);
            // descanso
            let rest = toSec(ftRest);
            stop();                 // pára cronómetro principal
           setResting(true);
setDisplay(`REST ${asClock(rest)}`);
setProg(1);
clearInterval(restRef.current);
restRef.current = setInterval(()=>{
  if(--rest < 0){
    clearInterval(restRef.current);
    setResting(false);
    start(true);
  }else{
    setDisplay(`REST ${asClock(rest)}`);
    setProg(rest / toSec(ftRest));
  }
},1000);
          }}>
          Concluir Ronda
        </button>
      )}

      {/* controlo principal */}
      <div className="controls">
        {!running && !paused && !resting && (          /* totalmente parado  */
    <button className="btn" onClick={start}>Start</button>
  )}

  {running && !paused && (           /* a contar → mostra Pause + Stop */
    <>
      <button className="btn secondary" onClick={pause}>Pause</button>
      <button className="btn stop"       onClick={stop}>Stop</button>
    </>
  )}

  {paused && (                       /* em pausa → mostra Resume + Stop */
    <>
      <button className="btn"        onClick={resume}>Resume</button>
      <button className="btn stop"   onClick={stop}>Stop</button>
    </>
  )}
      </div>
    </div>
  );
}
