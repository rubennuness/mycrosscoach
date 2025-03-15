// src/components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function BackButton({ label = 'Voltar' }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(-1);
  };

  return (
    <button onClick={handleClick} className="back-button">
      {label}
    </button>
  );
}

export default BackButton;
