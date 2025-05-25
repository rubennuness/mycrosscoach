// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';      // (crie ficheiro ao lado)

function ProfilePage() {
  const navigate   = useNavigate();
  const user       = JSON.parse(localStorage.getItem('user')) || {};
  const [metrics, setMetrics] = useState([]);

  /* carrega 1-RM ou outras estatísticas */
  useEffect(() => {
    fetch(`https://mycrosscoach-production.up.railway.app/api/metrics/${user.id}`)
      .then(r => r.json())
      .then(setMetrics)
      .catch(() => {});
  }, [user.id]);

  return (
    <div className="profile-wrapper">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      <section className="hero">
        <img className="avatar"
             src={`https://ui-avatars.com/api/?name=${user.name}&background=0e1b23&color=fff`}
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
        <h2>Opções</h2>
        <button onClick={() => navigate('/change-password')}>Alterar Password</button>
        <button onClick={() => navigate('/edit-profile')}>Editar Perfil</button>
        <button onClick={() => navigate('/privacy')}>Definições de Privacidade</button>
      </section>
    </div>
  );
}

export default ProfilePage;
