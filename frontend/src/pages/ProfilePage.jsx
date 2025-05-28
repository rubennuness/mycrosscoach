// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton                from '../components/BackButton';
import './ProfilePage.css';      // (crie ficheiro ao lado)


function ProfilePage() {
  const navigate   = useNavigate();
  const user       = JSON.parse(localStorage.getItem('user')) || {};
  const [metrics, setMetrics] = useState([]);

  /* carrega 1-RM ou outras estatísticas */
useEffect(() => {
  if(!user.id) return;
  fetch(`https://mycrosscoach-production.up.railway.app/api/users/${user.id}`)
   .then(r => r.json())
   .then(full => {
     setProfile(full);
     localStorage.setItem('user', JSON.stringify(full));
   })
   .catch(()=>{});

  fetch(`https://mycrosscoach-production.up.railway.app/api/metrics/${user.id}`)
    .then(r => r.json())
    .then(async basicList => {
      /* para cada métrica que não tem max, procura os resultados
         e calcula o maior valor */
      const filled = await Promise.all(
        basicList.map(async m => {
          if (m.max != null) return m;        
          try{
            const r = await fetch(
              `https://mycrosscoach-production.up.railway.app/api/metrics/view/${m.id}`);
            const { results=[] } = await r.json();
            const best = results.reduce(
              (acc, cur) => Math.max(acc, cur.value), 0);
            return { ...m, max: best };
          }catch{ return { ...m, max: '-' }; }
        })
      );
      setMetrics(filled);
    })
    .catch(() => {});
}, [user.id]);


  return (
    <div className="profile-wrapper">
      <BackButton />

      <section className="hero">
        <img className="avatar"
             src={user.avatar_url
           || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0e1b23&color=fff`}
             alt="avatar"/>
        <h1>{user.name}</h1>
        <p className="email">{user.email}</p>
      </section>

      <section className="metrics">
        <h2>Personal Records</h2>
        {metrics.length === 0 ? <p>(sem registos)</p> : (
          <ul>
            {metrics.map(m => (
              <li key={m.name}>
                <span>{m.name}</span>
                <strong>{m.max} kg</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="preferences">
        <button onClick={() => navigate('/change-password')}>Alterar Password</button>
        <button onClick={() => navigate('/edit-profile')}>Editar Perfil</button>
        <button onClick={() => navigate('/privacy')}>Definições de Privacidade</button>
      </section>
    </div>
  );
}

export default ProfilePage;
