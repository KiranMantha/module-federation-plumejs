/// <reference types="vitest" />
import federation from '@originjs/vite-plugin-federation';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  plugins: [
    federation({
      name: 'todo-components',
      filename: 'remoteEntry.js',
      exposes: {
        './List': './src/components/List.ts',
        './Input': './src/components/Input.ts'
      },
      shared: ['@plumejs/core']
    })
  ],
  build: {
    target: 'ES2022',
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      plugins: [
        visualizer({
          title: 'Plumejs example repo',
          open: true
        })
      ]
    }
  },
  server: {
    host: true,
    port: 4171,
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
