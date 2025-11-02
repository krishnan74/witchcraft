import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    exclude: ['@dojoengine/core']
  },
  // Ensure JSON imports work correctly
  assetsInclude: ['**/*.json'],
  // Note: Sourcemap warnings from starknet-types packages are harmless
  // They occur because the packages reference sourcemaps that aren't included in the npm packages
  // This doesn't affect functionality - it's just a development warning
})
