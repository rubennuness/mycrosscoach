// src/pages/RoleSelection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';

function RoleSelection() {
  const navigate = useNavigate();

  const handleCoachClick = () => {
    navigate('/dashboard-coach');
  };

  const handleAthleteClick = () => {
    navigate('/dashboard-athlete');
  };

  return (
    <div className="role-selection-container">
      <h1>Selecione o seu papel</h1>
      <div className="role-buttons">
        <button onClick={handleCoachClick}>Coach</button>
        <button onClick={handleAthleteClick}>Atleta</button>
      </div>
    </div>
  );
}

export default RoleSelection;
