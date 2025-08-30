// src/pages/DashboardCoach.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HamburgerMenu from '../components/HamburgerMenu';
import './DashboardCoach.css';

function DashboardCoach() {
  const navigate = useNavigate();

  // State para lista de atletas, controle de form etc.
  const [athletes, setAthletes] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteEmail, setNewAthleteEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [extrasById, setExtrasById] = useState({}); // { [athleteId]: { avatarUrl, lastSeen, todayStatus, planTitle } }

  // 1) No “useEffect”, chamamos GET /api/coach/athletes ao montar a página:
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('https://mycrosscoach-production.up.railway.app/api/coach/athletes', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Coach GET /athletes:', data);
        setAthletes(data); // atualiza lista no state
        loadExtras(data);
      })
      .catch((err) => console.error(err));
  }, []); // array vazio => executa uma vez ao montar

  // Presence heartbeat (every 60s)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) return;
    const tick = () => {
      fetch('https://mycrosscoach-production.up.railway.app/api/users/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      }).catch(() => {});
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // Carrega avatar/lastSeen (se disponível), status de hoje e titulo do plano
  const loadExtras = async (list) => {
    try{
      const token = localStorage.getItem('token');

      // 1) tenta buscar todos os utilizadores para mapear avatar_url e last_seen
      let users = [];
      try {
        const res = await fetch('https://mycrosscoach-production.up.railway.app/api/users');
        users = await res.json();
      } catch(_) { /* opcional */ }

      const userById = {};
      if (Array.isArray(users)) {
        users.forEach(u => { userById[u.id] = u; });
      }

      // 2) para cada atleta, busca o plano de hoje
      const todayYmd = new Date().toISOString().slice(0,10);
      const entries = await Promise.all(list.map(async a => {
        // Today status
        let todayStatus = 'No Workout';
        try {
          const r = await fetch(`https://mycrosscoach-production.up.railway.app/api/plans/by-date/${a.id}/${todayYmd}`);
          const j = await r.json();
          const phases = j?.phases || [];
          if (phases.length === 0) {
            todayStatus = 'No Workout';
          } else {
            const statuses = phases.map(p => (p.status || 'pending'));
            const allDone = statuses.every(s => s === 'done' || s === 'completed');
            const anyInProgress = statuses.some(s => s === 'in_progress' || s === 'active');
            const anyDone = statuses.some(s => s === 'done' || s === 'completed');
            if (allDone) todayStatus = 'Completed';
            else if (anyInProgress || anyDone) todayStatus = 'Active';
            else todayStatus = 'Not Started';
          }
        } catch(_) {}

        // Avatar / presence
        const avatarUrl = userById[a.id]?.avatar_url || null;
        const lastSeen  = userById[a.id]?.last_seen || null;
        const presenceActive = lastSeen ? (Date.now() - new Date(lastSeen).getTime() < 5*60*1000) : false;

        // Plan title – local placeholder until backend supports it
        const planTitle  = a.plan_title || '';

        return [a.id, { avatarUrl, lastSeen, todayStatus, presenceActive, planTitle }];
      }));

      const map = {};
      entries.forEach(([id, val]) => { map[id] = val; });
      setExtrasById(map);
    }catch(e){
      console.warn('extras error', e);
    }
  };

  // 2) Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // 3) Abre/fecha form para adicionar atleta
  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
    setErrorMsg('');
  };

  // 4) Submete form de adicionar atleta
  const handleAddAthleteSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const token = localStorage.getItem('token');
    const newAthlete = { name: newAthleteName, email: newAthleteEmail };

    fetch('https://mycrosscoach-production.up.railway.app/api/coach/athletes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newAthlete)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(d => {
            throw new Error(d.error || 'Erro ao adicionar atleta');
          });
        }
        return res.json();
      })
      .then((data) => {
        // Acrescenta localmente no state
        setAthletes([...athletes, data]);
        setNewAthleteName('');
        setNewAthleteEmail('');
        setShowAddForm(false);
      })
      .catch((err) => {
        setErrorMsg(err.message);
      });
  };

  // 5) Ao clicar num atleta
  const handleAthleteClick = (athleteId, athleteName) => {
      // enviamos no “state” da rota
      navigate(`/plan/${athleteId}`, {
        state: { athleteName }        
      });
    };

  const handleRemoveAthlete = (athleteId) => {
    const token = localStorage.getItem('token');
    setBusyId(athleteId);

    fetch(`https://mycrosscoach-production.up.railway.app/api/coach/athletes/${athleteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao remover');
        // filtra da lista local
        setAthletes(ath => ath.filter(a => a.id !== athleteId));
      })
      .catch(() => alert('Não foi possível remover o atleta.'))
      .finally(() => {
        setBusyId(null);
        setConfirmId(null);
      });
  };

  const handleEditPlanTitle = async (athleteId) => {
    const current = extrasById[athleteId]?.planTitle || '';
    const title = window.prompt('Set current plan title for this athlete:', current || '');
    if (title === null) return;
    try{
      const token = localStorage.getItem('token');
      await fetch(`https://mycrosscoach-production.up.railway.app/api/coach/athletes/${athleteId}/plan-title`,{
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
        body: JSON.stringify({ title })
      });
    }catch(_){/* ignore */}
    setExtrasById(prev => ({ ...prev, [athleteId]: { ...prev[athleteId], planTitle: title } }));
  };

  return (
    <div className="dashboard-split-container">
      <div className="dashboard-left">
        <div className="dashboard-left-content">
          <div className="dash-header">
            <HamburgerMenu />
            <h2>Coach Dashboard</h2>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>

          <div className="add-athlete-section">
            <button className="add-athlete-btn" onClick={toggleAddForm}>
              Add Athlete
            </button>
          </div>

          {showAddForm && (
            <form className="add-athlete-form" onSubmit={handleAddAthleteSubmit}>
              {errorMsg && <p className="error-message">{errorMsg}</p>}
              <div>
                <label>Nome:</label>
                <input
                  type="text"
                  value={newAthleteName}
                  onChange={(e) => setNewAthleteName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Email:</label>
                <input
                  type="email"
                  value={newAthleteEmail}
                  onChange={(e) => setNewAthleteEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Adicionar</button>
            </form>
          )}

          <div className="activity-header">
            <h3>Member’s Activity</h3>
            <div className="legend">
              <span className="legend-dot active"></span> Active
              <span className="legend-dot inactive"></span> Inactive
            </div>
          </div>

          <div className="activity-table">
            <div className="activity-head">
              <div className="col name">Name</div>
              <div className="col status-today">Today’s Workout Status</div>
              <div className="col current-plan">Current Plan</div>
              <div className="col presence">Status</div>
              <div className="col actions"></div>
            </div>

            {athletes.map((ath) => {
              const extra = extrasById[ath.id] || {};
              return (
                <div key={ath.id} className="activity-row">
                  <div className="col name">
                    <div className="athlete-cell" onClick={() => handleAthleteClick(ath.id, ath.name)}>
                      {extra.avatarUrl ? (
                        <img className="avatar" src={extra.avatarUrl} alt={ath.name} />
                      ) : (
                        <div className="avatar placeholder">{(ath.name||'?').charAt(0)}</div>
                      )}
                      <div className="name-email">
                        <div className="name-line">{ath.name}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col status-today">
                    <span className={`badge ${
                      extra.todayStatus === 'Completed' ? 'badge-completed' :
                      extra.todayStatus === 'Active' ? 'badge-active' :
                      extra.todayStatus === 'Not Started' ? 'badge-not-started' : 'badge-no-workout'
                    }`}>
                      {extra.todayStatus || 'No Workout'}
                    </span>
                  </div>

                  <div className="col current-plan">
                    <div className="plan-cell">
                      <span className="plan-title">{extra.planTitle || '—'}</span>
                      <button className="plan-edit" onClick={() => handleEditPlanTitle(ath.id)} title="Set plan title">✎</button>
                    </div>
                  </div>

                  <div className="col presence">
                    <span className={`presence ${extra.presenceActive ? 'on' : 'off'}`}>
                      {extra.presenceActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="col actions">
                    <button
                      className="remove-btn"
                      disabled={busyId === ath.id}
                      onClick={() => setConfirmId(ath.id)}
                      aria-label="Remove athlete"
                    >
                      {/* simple minimal trash icon */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 3h6m-8 4h10m-1 0-.7 12.6a2 2 0 0 1-2 1.9H9.7a2 2 0 0 1-2-1.9L7 7m3 3v7m4-7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    {confirmId === ath.id && (
                      <div className="confirm-box">
                        <span className="confirm-message">Remover este atleta?</span>
                        <button
                          className="confirm-btn confirm-cancel"
                          onClick={() => setConfirmId(null)}
                          disabled={busyId === ath.id}
                        >
                          Cancelar
                        </button>
                        <button
                          className="confirm-btn confirm-remove"
                          onClick={() => handleRemoveAthlete(ath.id)}
                          disabled={busyId === ath.id}
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="dashboard-right">
        {/* fundo ou imagem */}
      </div>
    </div>
  );
}

export default DashboardCoach;
