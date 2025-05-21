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
      })
      .catch((err) => console.error(err));
  }, []); // array vazio => executa uma vez ao montar

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

          <p className="athlete-list-title">Lista de atletas:</p>
          <ul className="athlete-list">
            {athletes.map((ath) => (
              <li
                key={ath.id}
                className="athlete-item"
                onClick={() => handleAthleteClick(ath.id, ath.name)}
              >
                {ath.name} - {ath.email}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="dashboard-right">
        {/* fundo ou imagem */}
      </div>
    </div>
  );
}

export default DashboardCoach;
