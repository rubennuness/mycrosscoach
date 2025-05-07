
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // expõe o Vite na rede
    port: 5173,
    allowedHosts: true,

    /* --- PROXY PARA A API --- 
    proxy: {
      '/api':  'http://$VITE_API_URL:3000',
      '/auth': 'http://$VITE_API_URL:3000',
      '/progress': 'http://$VITE_API_URL:3000'   // (acrescenta outros prefixos se existirem)
    }*/
  }
});
