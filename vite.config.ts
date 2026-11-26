import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/baeuda/' : '/',
  plugins: [react()],
  // the preview assigns a free PORT to each worktree, so parallel sessions do not share a server or save
  server: { port: Number(process.env.PORT) || 5173, strictPort: Boolean(process.env.PORT) },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three')) {
            return 'three-vendor';
          }
          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }
          if (id.includes('CityShops')) {
            return 'city-shops';
          }
          return undefined;
        },
      },
    },
  },
});
