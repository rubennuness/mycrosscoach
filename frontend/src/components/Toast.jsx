// src/components/Toast.jsx
import React, { useEffect } from 'react';

/**
 * Exibe uma mensagem no canto superior direito por alguns segundos.
 * @param {string} message Mensagem a exibir
 * @param {function} onClose Função para fechar/remover a mensagem
 */
function Toast({ message, onClose }) {
  // useEffect para limpar a mensagem após 5 segundos
  useEffect(() => {
    if (!message) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // 5 segundos
    
    // cleanup se o componente desmontar antes
    return () => clearTimeout(timer);
  }, [message, onClose]);

  // Se não houver mensagem, não renderiza nada
  if (!message) return null;

  // estilização básica
  const toastStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: 'green',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    zIndex: 9999,
  };

  return (
    <div style={toastStyle}>
      {message}
    </div>
  );
}

export default Toast;
