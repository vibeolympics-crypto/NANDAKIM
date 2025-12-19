import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import viteCompression from 'vite-plugin-compression';
import { copyFileSync } from 'fs';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: 'localhost',
    port: 8093,
    strictPort: false,
    open: true,
    middlewareMode: false,
    watch: {
      usePolling: false,  // 폴링 비활성화 (안정성 향상)
      interval: 1000,  // 감지 간격 증가
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    hmr: {
      host: 'localhost',
      port: 8093,
      protocol: 'ws',
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    ...(mode === 'production'
      ? [
          viteCompression({
            algorithm: 'gzip',
            ext: '.gz',
            threshold: 10240,
            deleteOriginFile: false,
          }),
          viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br',
            threshold: 10240,
            deleteOriginFile: false,
          }),
          {
            name: 'copy-service-worker',
            closeBundle() {
              try {
                if (fs.existsSync('public/service-worker.js')) {
                  copyFileSync('public/service-worker.js', 'dist/service-worker.js');
                  console.log('✓ Service worker copied to dist');
                }
                // Copy music playlist JSON for static hosting
                if (fs.existsSync('public/music-playlist.json')) {
                  copyFileSync('public/music-playlist.json', 'dist/music-playlist.json');
                  console.log('✓ Music playlist copied to dist');
                }
              } catch (error) {
                console.warn('⚠ Failed to copy files:', error instanceof Error ? error.message : String(error));
              }
            },
          },
        ]
      : []),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false, // Disable sourcemaps for production
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Optimize chunking strategy
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-hook-form',
      'zod',
      '@tanstack/react-query',
      'lucide-react',
    ],
    exclude: ['recharts'],
  },
}));
