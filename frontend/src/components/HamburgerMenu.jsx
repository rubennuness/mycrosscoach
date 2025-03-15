// src/components/HamburgerMenu.jsx
import React, { useState } from 'react';
import './HamburgerMenu.css';

function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
  };

  return (
    <div className="hamburger-menu-container">
      {/* Ícone das 3 linhas */}
      <div className="hamburger-icon" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Dropdown exibido somente se “open” for true */}
      {open && (
        <div className="hamburger-dropdown">
          <ul>
            <li>Opção 1</li>
            <li>Opção 2</li>
            <li>Opção 3</li>
            {/* Acrescente aqui mais itens conforme necessidade */}
          </ul>
        </div>
      )}
    </div>
  );
}

export default HamburgerMenu;
