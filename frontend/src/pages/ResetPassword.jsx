import {useState} from 'react';
import {useParams,useNavigate} from 'react-router-dom';
import './Auth.css';

export default function ResetPassword(){
  const {token}      = useParams();
  const navigate     = useNavigate();
  const [pw,setPw]   = useState('');
  const [ok,setOk]   = useState(false);
  const [msg,setMsg] = useState('');

  const handle = async e=>{
    e.preventDefault();
    try{
      const r = await fetch(`/auth/reset-password/${token}`,{
        method :'POST',
        headers:{'Content-Type':'application/json'},
        body   : JSON.stringify({password:pw})
      });
      const d = await r.json();
      if(r.ok){ setOk(true); setMsg(d.message); setTimeout(()=>navigate('/login'),2500); }
      else    { setMsg(d.error || 'Erro'); }
    }catch{ setMsg('Problema de rede'); }
  };

  return(
    <div className="auth-container">
      <h1>Nova Password</h1>
      {ok? <p>{msg}</p> : (
        <form onSubmit={handle}>
          <label>Nova password:</label>
          <input type="password" value={pw}
                 onChange={e=>setPw(e.target.value)} required minLength={6}/>
          <button type="submit">Guardar</button>
        </form>
      )}
      {msg && !ok && <p>{msg}</p>}
    </div>
  );
}
