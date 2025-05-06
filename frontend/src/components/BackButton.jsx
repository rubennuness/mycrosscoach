// src/components/BackButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";         // ➊ novo ficheiro de estilos

function BackButton({ ariaLabel = "Voltar" }) {
  const navigate = useNavigate();

  return (
    <button
      className="back-arrow"
      onClick={() => navigate(-1)}
      aria-label={ariaLabel}
      title="Voltar"
    >
      {/* seta (SVG, 24 × 24 px) */}
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
        <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default BackButton;
