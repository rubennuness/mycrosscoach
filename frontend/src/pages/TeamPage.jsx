import React, { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import './TeamPage.css';       

export default function TeamPage() {
  const user     = JSON.parse(localStorage.getItem('user'));  // coach
  const [teams , setTeams ] = useState([]);
  const [name  , setName  ] = useState('');

  /* carrega equipas onde sou admin ou membro -------------------- */
  useEffect(() => {
    fetch(
    'https://mycrosscoach-production.up.railway.app/api/team',
    { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } }
  )
      .then(r => r.json()).then(setTeams);
  }, []);

  /* cria equipa -------------------------------------------------- */
  const create = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    const r = await fetch(
      'https://mycrosscoach-production.up.railway.app/api/team',
      { method : 'POST',
        headers: { 'Content-Type':'application/json',
                   Authorization:`Bearer ${localStorage.getItem('token')}` },
        body   : JSON.stringify({ name }) });
    if (!r.ok) return alert('Erro');
    const t = await r.json();      // {id,name,is_admin:true}
    setTeams(ts => [...ts, t]);
    setName('');
  };

  /* pedir para aderir ------------------------------------------- */
  const join = async teamId => {
    await fetch(
      `https://mycrosscoach-production.up.railway.app/api/team/${teamId}/join`,
      { method:'POST',
        headers:{Authorization:`Bearer ${localStorage.getItem('token')}`} });
    alert('Pedido enviado ao admin.');
  };

  return (
    <div className="team-wrapper">
      <BackButton />
      <h1>My Team(s)</h1>

      <form onSubmit={create} className="team-create">
        <input
          placeholder="Team name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button>Create</button>
      </form>

      <ul className="team-list">
        {teams.map(t => (
          <li key={t.id}>
            {t.name}
            {t.is_admin ? ' (admin)' :
             t.pending   ? ' (pending)' :
             <button onClick={() => join(t.id)}>Join</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
