// src/pages/Subscribe.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import './Subscribe.css';

function Subscribe() {
  return (
    <div className="subscribe-container">
      <BackButton />                                   {/* ⬅️ NOVO */}
      <div className="subscribe-content">
        <h1>Subscrição Mensal</h1>
        <p>
          Recebe acompanhamento personalizado do teu treinador, além de recursos exclusivos para otimizar 
          o teu treino e compartilhar o progresso com outros atletas.
        </p>

        <div className="benefits-list">
          <h2>O que ganhas com a Assinatura:</h2>
          <ul>
            <li><strong>Registar Alimentação:</strong> Insira diretamente as recomendações da sua nutricionista, 
              facilitando o acompanhamento pelo treinador e mantendo tudo num só lugar.</li>
            <li><strong>Partilhar Exercícios:</strong> Partilha os teus treinos e recebe feedback de outras pessoas 
              orientadas pelo mesmo treinador, formando uma rede de motivação.</li>
            <li><strong>Check-ins semanais:</strong> Tem sessões de feedback direto com o teu treinador para 
              ajustes no treino ou na rotina alimentar.</li>
            <li><strong>Suporte prioritário:</strong> Respostas rápidas às tuas dúvidas e orientações 
              personalizadas para atingir melhores resultados.</li>
          </ul>
        </div>

        <div className="price-box">
          <h2>€9,99 / mês</h2>
          <p className="price-note">Cancele quando quiser, sem burocracias.</p>
        </div>

        <button className="btn-subscribe">Subscrever Agora</button>
        <BackButton />
      </div>
    </div>
  );
}

export default Subscribe;
