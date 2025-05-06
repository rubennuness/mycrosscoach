// src/components/BackButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";

function BackButton({ ariaLabel = "Voltar" }) {
  const navigate = useNavigate();

  return (
    <button
      className="back-arrow"
      onClick={() => navigate(-1)}
      aria-label={ariaLabel}
      title="Voltar"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        {/* stroke usa a cor corrente → herdará #fff que definimos no CSS */}
        <path d="M15 18L9 12L15 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default BackButton;