// src/components/BackButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";

function BackButton({ label = "← Voltar" }) {
  const navigate = useNavigate();
  return (
    <button
      className="back-arrow"
      onClick={() => navigate(-1)}
      aria-label="Voltar"
    >
      {label}
    </button>
  );
}

export default BackButton;
