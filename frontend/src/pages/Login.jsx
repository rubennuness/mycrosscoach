import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // ADICIONAMOS useNavigate
import BackButton from "../components/BackButton";   // ⬅️ novo import
import './Login.css';

function Login() {
  const navigate = useNavigate(); // Hook para navegar programaticamente
  const [email,     setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg , setErrorMsg ] = useState('');
  const [remember , setRemember ] = useState(false);
  const [stored,    setStored]    = useState(
   JSON.parse(localStorage.getItem('savedCreds') || '[]')
 );


 /* devolve a pass guardada para um dado e-mail (ou '') */
 const findPass = em => {
   const hit = stored.find(c => c.email === em);
   return hit ? atob(hit.pass) : '';   // ↩︎ descodifica Base-64
 };
  
  //const API = `${window.location.protocol}//${window.location.hostname}:3000`;
  const API = import.meta.env.VITE_API_URL;
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(''); // limpa mensagens de erro anteriores

    try {
      const response = await fetch('https://mycrosscoach-production.up.railway.app/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Se status da resposta NÃO for 2xx, lançamos erro
        throw new Error(data.error || 'Falha no login');
      }

      // Se chegou aqui, é porque deu certo.
      // Salva token e user no localStorage (pode adaptar para context se preferir).
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      /* se o utilizador assinalou “Remember me” guardamos só o e-mail;    */
    /* passo 4  · “Remember me” guarda (ou actualiza) credenciais  */
   if (remember){
     const prev   = JSON.parse(localStorage.getItem('savedCreds') || '[]');
     const next   = [
       ...prev.filter(c => c.email !== email),     // remove duplicados
       { email, pass: btoa(password) }             // Base-64 não é cifragem!
     ];
     localStorage.setItem('savedCreds', JSON.stringify(next));
     setStored(next);                              // refresca o datalist
   }

      if (data.user.role === 'coach') {
        navigate('/dashboard-coach');
      } else {
        // se não for 'coach', consideramos 'athlete'
        navigate('/dashboard-athlete');
      }

    } catch (err) {
      // Caso haja erro (401, 500 etc.), exibimos a mensagem
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="login-split-container">
      <BackButton to="/" />                                   
      {/* Esquerda: painel de login */}
      <div className="login-left">
        <div className="login-left-content">

          <div className="logo-area">
            <h2>MyCrossCoach</h2>
          </div>

          <h3>Sign in to your account</h3>

          {errorMsg && <p className="error-message">{errorMsg}</p>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                list="savedEmails"
                placeholder="example@domain.com"
                value={email}
                onChange={e => {
                const em = e.target.value;
                setEmail(em);
                /* se já existir nas guardadas → preenche a password */
                setPassword(findPass(em));
                }}
                required
              />
              <datalist id="savedEmails">
              {stored.map(c => <option key={c.email} value={c.email} />)}
              </datalist>
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="login-options">
              <div>
                <input type="checkbox" id="rememberMe" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <Link to="/forgot-password" className="forgot-link">
                Forgot your password?
              </Link>
            </div>

            <button type="submit" className="btn-signin">Sign in</button>
          </form>
          
          <div className="login-footer">
            <span>Não tem conta?</span>
            <Link to="/register" className="register-link">Registar-se</Link>
          </div>
        </div>
      </div>

      {/* Direita: imagem de fundo */}
      <div className="login-right">
        {/* Você pode colocar uma imagem de background via CSS ou usar um <img /> */}
      </div>
    </div>
  );
}

export default Login;
