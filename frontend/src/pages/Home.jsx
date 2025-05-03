// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';  // Para navegar até /login ou /subscribe
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Melhore sua Performance com MyCrossCoach</h1>
          <p className="hero-subtitle">
            Tenha acesso a acompanhamento especializado do seu coach e 
            compartilhe suas rotinas com atletas que têm o mesmo treinador.
          </p>
          <div className="hero-buttons">
            {/* Botão para Login (caso o usuário já tenha conta) */}
            <Link to="/login" className="hero-button">Login</Link>
            {/* Botão para página de assinatura (caso queira assinar direto) */}
            <Link to="/register"  className="hero-button hero-button-secondary">
            Registar
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Funcionalidades</h2>
        
        <div className="features-grid">
          {/* Funcionalidade 1: Grátis */}
          <div className="feature-card free-feature">
            <h3>Acompanhamento Básico</h3>
            <p>
              Interaja com seu coach e registre informações essenciais do seu treino
              para ter um panorama geral do seu desenvolvimento.
            </p>
            <p className="badge-free">Grátis</p>
          </div>

          {/* Funcionalidade 2: Grátis */}
          <div className="feature-card free-feature">
            <h3>Comunidade Geral</h3>
            <p>
              Participe de discussões públicas com outros atletas, troque dicas 
              e encontre motivação em grupo.
            </p>
            <p className="badge-free">Grátis</p>
          </div>

          {/* Funcionalidade 3: Premium */}
          <div className="feature-card premium-feature">
            <h3>Registo de Alimentação</h3>
            <p>
              Adicione o plano de alimentação indicado pela sua nutricionista e 
              receba feedback direto do seu coach.
            </p>
            <p className="badge-premium">Premium</p>
          </div>

          {/* Funcionalidade 4: Premium */}
          <div className="feature-card premium-feature">
            <h3>Partilha de Exercícios</h3>
            <p>
              Compartilhe seus treinos com colegas que tenham o mesmo coach e receba 
              insights mais profundos para evoluir em conjunto.
            </p>
            <p className="badge-premium">Premium</p>
          </div>
        </div>

        {/* CTA para assinatura */}
        <div className="premium-callout">
          <h3>Desbloqueie tudo com a Assinatura Mensal</h3>
          <p>
            Tenha acesso completo às funcionalidades Premium e um acompanhamento ainda 
            mais personalizado do seu coach.
          </p>
          <Link to="/subscribe" className="premium-button">Assinar Agora</Link>
        </div>
      </section>

      {/* About Section (Opcional) */}
      <section className="about-section">
        <div className="about-content">
          <h2>Sobre o MyCrossCoach</h2>
          <p>
           Nós unimos coaches especializados e atletas em uma plataforma única, 
            potencializando resultados através de um acompanhamento personalizado 
            e uma comunidade engajada.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <p>© {new Date().getFullYear()} MyCrossCoach - Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default Home;
