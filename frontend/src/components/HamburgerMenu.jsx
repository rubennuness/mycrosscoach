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

      {/* side-drawer + overlay */}
     {open && (
       <div className="drawer-overlay" onClick={() => setOpen(false)}>
         <nav
           className="side-drawer"
           onClick={e => e.stopPropagation()}  /* impede fecho ao clicar dentro */
         >
          <button
             className="drawer-close"
             onClick={() => setOpen(false)}
             aria-label="close"
           >
             ×
           </button>

           <ul>
             {/* opções comuns */}
             {role === 'athlete' && (
               <>
                 <li onClick={() => navigate('/timers')}>Timers</li>
                 <li onClick={() => navigate('/calendar')}>Calendário</li>
                 <li onClick={() => navigate('/metrics')}>Métricas</li>
               </>
             )}
             {role === 'coach' && (
            <>
            <li onClick={() => navigate('/team')}>Team</li>
            </>
            )}
           </ul>
         </nav>
       </div>
     )}
    </div>
  );
}

export default HamburgerMenu;
