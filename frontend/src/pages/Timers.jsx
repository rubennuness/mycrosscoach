// src/pages/Timers.jsx
import React, { useState, useEffect, useRef } from 'react';
import './Timers.css';

const fmt = (t)=>String(t).padStart(2,'0');

export default function Timers(){
  /* ---------- state comum ---------- */
  const [mode,setMode]           = useState('amrap');
  const [running,setRunning]     = useState(false);
  const [paused ,setPaused ]     = useState(false);
  const [display,setDisplay]     = useState('00:00');
  const [round,setRound]         = useState(1);
  const intervalRef              = useRef(null);
  const restRef     = useRef(null);
  const secsRef    = useRef(0); 

  /* ---------- inputs ---------- */
  const [amrapMin,setAmrapMin]   = useState(10);
  const [amrapCnt,setAmrapCnt]   = useState(0);      // NOVO – contador
  const [ftRounds,setFtRounds]   = useState(5);      // FOR TIME – nº rondas alvo
  const [ftRest,setFtRest]       = useState(30);     // FOR TIME – descanso (s)
  const [ftCur,setFtCur]         = useState(1);      // ronda actual

  const [emomMin,setEmomMin]     = useState(12);
  const [tabWork,setTabWork]     = useState(20);
  const [tabRest,setTabRest]     = useState(10);
  const [tabRounds,setTabRounds] = useState(8);

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
    };


    const pause = () => {
        if (!running) return;
        clearInterval(intervalRef.current);
        clearInterval(restRef.current);
        intervalRef.current = restRef.current = null;
        setPaused(true);
        setRunning(true);      // continua “running”, mas flag de pausa = true
      };

  const start=()=>{
    stop();
    setRunning(true);
    setPaused(false);
    let secs, left, work=true;

    /* ---------- AMRAP ---------- */
    if(mode==='amrap'){
        secsRef.current = amrapMin * 60;
      setAmrapCnt(0);                       // reset contador
      setDisplay(`${fmt(amrapMin)}:00`);
      intervalRef.current = setInterval(() => {
          if (--secsRef.current < 0) { stop(); return; }
          setDisplay(`${fmt(Math.floor(secsRef.current/60))}:${fmt(secsRef.current%60)}`); 
      },1000);
      return;
    }

    /* ---------- FOR TIME ---------- */
    if(mode==='forTime'){
        secsRef.current = 0;
      setFtCur(1);
      setDisplay('00:00');
      intervalRef.current = setInterval(() => {
          secsRef.current++;
         setDisplay(`${fmt(Math.floor(secsRef.current/60))}:${fmt(secsRef.current%60)}`);
      },1000);
      return;
    }

    /* ---------- EMOM ---------- */
      if (mode === 'emom') {
            let seconds   = 60;        // começamos a exibir “60”
            let current   = 1;         // ronda actual
            secsRef.current = emomMin * 60;
        
            setRound(current);
            setDisplay('60');
        
            intervalRef.current = setInterval(() => {
                  secsRef.current--;           // ↓ 1 segundo
                  seconds--;              // ↓ 1 segundo
        
              /* Terminou o minuto --------------------------------- */
              if (seconds < 0) {
                current += 1;
        
               /* Dica extra: parar no nº de rondas escolhido */
               if (current > emomMin) {   // emomMin == total de rondas
              stop();                  // pára o cronómetro
                  return;
                }
        
                setRound(current);   // actualiza o «Min X»
                seconds = 60;        // reinicia o contador do minuto
              }
        
              setDisplay(fmt(seconds));
            }, 1000);
        
            return;
          }

    /* ---------- TABATA ---------- */
    if(mode==='tabata'){
        secsRef.current = left = tabWork;
      setRound(1);
      setDisplay(fmt(left));
      intervalRef.current=setInterval(()=>{
        if (--secsRef.current < 0){
          if(work){ work=false; left=tabRest; }
          else{
            work=true; setRound(r=>r+1);
            if(round>=tabRounds){stop();return;}
            secsRef.current = work ? tabWork : tabRest;
          }
        }
        setDisplay(fmt(secsRef.current));
      },1000);
    }
  };

  const resume = () => {
    if (!paused) return;
  
    setPaused(false);
  
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
      intervalRef.current = setInterval(() => {
        secsRef.current--;
        const inMin = secsRef.current % 60;
        if (inMin === 0) setRound(r => r + 1);
        if (secsRef.current < 0) { stop(); return; }
        setDisplay(fmt(inMin === 0 ? 60 : inMin));
      }, 1000);
      return;
    }
  
    if (mode === 'tabata') {
      let work = true;
      intervalRef.current = setInterval(() => {
        secsRef.current--;
        if (secsRef.current < 0) {
          if (work) { work = false; secsRef.current = tabRest; }
          else {
            work = true; setRound(r => r + 1);
            if (round >= tabRounds) { stop(); return; }
            secsRef.current = tabWork;
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
      <h1>Timers de Treino</h1>

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
          <label>Minutos:
            <input type="number" min="1" value={amrapMin}
                   onChange={e=>setAmrapMin(+e.target.value)}/>
          </label>
        )}

        {mode==='forTime' && (
          <>
            <label>Rondas alvo:
              <input type="number" min="1" value={ftRounds}
                     onChange={e=>setFtRounds(+e.target.value)}/>
            </label>
            <label>Rest entre rondas (s):
              <input type="number" min="0" value={ftRest}
                     onChange={e=>setFtRest(+e.target.value)}/>
            </label>
          </>
        )}

        {mode==='emom' && (
          <label>Minutos:
            <input type="number" min="1" value={emomMin}
                   onChange={e=>setEmomMin(+e.target.value)}/>
          </label>
        )}

        {mode==='tabata' && (
          <>
            <label>Work (s):
              <input type="number" min="1" value={tabWork}
                     onChange={e=>setTabWork(+e.target.value)}/>
            </label>
            <label>Rest (s):
              <input type="number" min="1" value={tabRest}
                     onChange={e=>setTabRest(+e.target.value)}/>
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
      <div className="timer-display">
        {display}
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

      {/* botões extra AMRAP / FOR TIME */}
      {mode==='amrap' && running && (
        <button
          className="btn secondary"
          style={{marginBottom:12}}
          onClick={()=>setAmrapCnt(c=>c+1)}>
          +1 Ronda
        </button>
      )}

      {mode==='forTime' && running && (
        <button
          className="btn secondary"
          style={{marginBottom:12}}
          onClick={()=>{
            if(ftCur>=ftRounds){ stop(); return; }
            setFtCur(c=>c+1);
            // descanso
            let rest = ftRest;
            stop();                 // pára cronómetro principal
            setDisplay(`REST ${rest}s`);
            clearInterval(restRef.current);
            restRef.current = setInterval(()=>{
              if(--rest<0){
                stop();  
                start();            // retoma
              }else{
                setDisplay(`REST ${rest}s`);
              }
            },1000);
          }}>
          Concluir Ronda
        </button>
      )}

      {/* controlo principal */}
      <div className="controls">
        {!running && !paused && (          /* totalmente parado  */
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
