// src/components/HamburgerMenu.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HamburgerMenu.css';

function HamburgerMenu() {
  const [open,setOpen]   = useState(false);
  const navigate          = useNavigate();
  const role              = JSON.parse(localStorage.getItem('user'))?.role;

  return (
    <div className="hamburger-menu-container">
      <div className="hamburger-icon" onClick={()=>setOpen(!open)}>
        <span/><span/><span/>
      </div>

      {open && (
        <div className="hamburger-dropdown">
          <ul onClick={()=>setOpen(false)}>
            {/* opções comuns … */}
            {role==='athlete' && (
              <>
                              <li onClick={()=>navigate('/timers')}>Timers</li>
                              <li onClick={()=>navigate('/calendar')}>Calendar</li>
                            </>
              
            )}
            {/* podes acrescentar mais itens */}
          </ul>
        </div>
      )}
    </div>
  );
}

export default HamburgerMenu;
