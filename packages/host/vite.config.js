/// <reference types="vitest" />
import federation from '@originjs/vite-plugin-federation';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  plugins: [
    federation({
      name: 'host',
      remotes: {
        remoteTodo: {
          external: 'http://localhost:4171/assets/remoteEntry.js',
          externalType: 'url'
        }
      },
      shared: {
        '@plumejs/core': { singleton: true }
      }
    })
  ],
  build: {
    target: 'esnext',
    modulePreload: false,
    minify: false,
    cssCodeSplit: false
    // outDir: 'dist',
    // sourcemap: false,
    // rollupOptions: {
    //   external: [
    //     {
    //       remoteTodo: 'http://localhost:4171/assets/remoteEntry.js'
    //     }
    //   ]
    //   plugins: [
    //     visualizer({
    //       title: 'Plumejs example repo',
    //       open: false
    //     })
    //   ]
    // }
  },
  server: {
    host: true,
    port: 4170,
    open: '/'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['vitest.setup.js'],
    deps: {
      inline: [/^(?!.*vitest).*$/]
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      cleanOnRerun: true,
      reportsDirectory: 'coverage'
    }
  }
});
