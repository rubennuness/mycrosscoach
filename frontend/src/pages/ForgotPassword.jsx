import {useState} from 'react';
import './Auth.css';          // reutilize o estilo dos formulários

export default function ForgotPassword(){
  const [email,setEmail]     = useState('');
  const [sent,setSent]       = useState(false);
  const [msg ,setMsg ]       = useState('');

  const handleSubmit = async e =>{
    e.preventDefault();
    try{
      const r = await fetch('/auth/forgot-password',{
        method :'POST',
        headers:{'Content-Type':'application/json'},
        body   : JSON.stringify({email})
      });
      const d = await r.json();
      setSent(true);
      setMsg(d.message || 'Verifique o seu email');
    }catch{ setMsg('Erro a contactar o servidor'); }
  };

  return(
    <div className="auth-container">
      <h1>Recuperar Password</h1>

      {sent ? <p>{msg}</p> : (
        <form onSubmit={handleSubmit}>
          <label>Email:</label>
          <input type="email" value={email}
                 onChange={e=>setEmail(e.target.value)} required />
          <button type="submit">Enviar link</button>
        </form>
      )}
    </div>
  );
}
