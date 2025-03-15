// src/pages/Subscribe.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import './Subscribe.css';

function Subscribe() {
  return (
    <div className="subscribe-container">
      <div className="subscribe-content">
        <h1>Assinatura Mensal</h1>
        <p>
          Receba acompanhamento personalizado do seu coach, além de recursos exclusivos para otimizar 
          seu treino e compartilhar seu progresso com a comunidade do seu coach.
        </p>

        <div className="benefits-list">
          <h2>O que você ganha com a Assinatura:</h2>
          <ul>
            <li><strong>Registrar Alimentação:</strong> Insira diretamente as recomendações da sua nutricionista, 
              facilitando o acompanhamento pelo coach e mantendo tudo em um só lugar.</li>
            <li><strong>Partilhar Exercícios:</strong> Compartilhe seus treinos e receba feedback de outras pessoas 
              orientadas pelo mesmo coach, formando uma rede de motivação.</li>
            <li><strong>Check-ins semanais:</strong> Tenha sessões de feedback direto com o seu coach para 
              ajustes no treino ou na rotina alimentar.</li>
            <li><strong>Suporte prioritário:</strong> Respostas rápidas às suas dúvidas e orientações 
              personalizadas para atingir melhores resultados.</li>
          </ul>
        </div>

        <div className="price-box">
          <h2>€9,99 / mês</h2>
          <p className="price-note">Cancele quando quiser, sem burocracias.</p>
        </div>

        <button className="btn-subscribe">Assinar Agora</button>
        <BackButton />
      </div>
    </div>
  );
}

export default Subscribe;
