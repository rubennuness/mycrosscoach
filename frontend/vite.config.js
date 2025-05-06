
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // expõe o Vite na rede
    port: 5173,
    allowedHosts: ['renewed-charisma-production-0450.up.railway.app'],

    /* --- PROXY PARA A API --- */
    proxy: {
      '/api':  'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/progress': 'http://localhost:3000'   // (acrescenta outros prefixos se existirem)
    }
  }
});
