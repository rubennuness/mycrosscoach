// src/pages/VerifyEmail.jsx
import React,{useState} from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import './VerifyEmail.css';

function VerifyEmail(){
  const navigate      = useNavigate();
  const email         = new URLSearchParams(useLocation().search).get('email');
  const [code,setCode]= useState('');
  const [msg ,setMsg ]= useState('');

  const handleSubmit = async (e)=>{
    e.preventDefault();
    setMsg('');
    const r  = await fetch('https://mycrosscoach-production.up.railway.app/auth/verify',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email,code})
    });
    const d = await r.json();
    if(!r.ok){ setMsg(d.error||'Erro'); return; }
    setMsg('Verificado! Pode fazer login.');
    setTimeout(()=>navigate('/login'),1500);
  };

  return(
    <div className="verify-container">
      <h1>Confirmação de E-mail</h1>
      <p>Introduza o código enviado para <b>{email}</b></p>
      {msg && <p className="verify-msg">{msg}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" value={code} onChange={e=>setCode(e.target.value)}
               maxLength={6} placeholder="Código" required/>
        <button type="submit">Confirmar</button>
      </form>
    </div>
  );
}
export default VerifyEmail;
