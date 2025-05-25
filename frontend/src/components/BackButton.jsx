// src/components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';          // (mantém o teu css, se já existir)

function BackButton({ label = '← Back', to = null }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to)               // 👉 destino explícito
      navigate(to, { replace: true });
    else                  // 👉 comportamento clássico
      navigate(-1);
  };

  return (
    <button onClick={handleClick} className="back-arrow">
      {label}
    </button>
  );
}

export default BackButton;
