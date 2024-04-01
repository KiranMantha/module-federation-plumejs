/// <reference types="vitest" />
import federation from '@originjs/vite-plugin-federation';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  plugins: [
    federation({
      name: 'remote_todo',
      filename: 'remoteEntry.js',
      exposes: {
        './List': './src/components/List',
        './Input': './src/components/Input'
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
    port: 4171,
    open: '/'
  },
  preview: {
    port: 4171,
    strictPort: true
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
