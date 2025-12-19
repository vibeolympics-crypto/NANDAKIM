import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSentry } from './lib/sentry';
import * as serviceWorkerRegistration from './lib/serviceWorkerRegistration';
import { initWebVitals } from './lib/webVitals';

// Initialize Sentry error tracking (safe initialization)
// Requirements: 4.5, 7.5 - Set up error tracking
try {
  initializeSentry();
} catch (error) {
  // Silent failure - don't block app startup
  if (import.meta.env.DEV) {
    console.warn('[Init] Sentry initialization failed:', error);
  }
}

// Initialize Web Vitals monitoring (safe initialization)
// Requirements: 4.1, 4.2, 4.3, 8.1 - Measure FCP, LCP, CLS, TTFB, INP
try {
  initWebVitals((report) => {
    // Log performance metrics in development
    if (import.meta.env.DEV) {
      console.log('[Performance Report]', report);
    }
  });
} catch (error) {
  // Silent failure - don't block app startup
  if (import.meta.env.DEV) {
    console.warn('[Init] Web Vitals initialization failed:', error);
  }
}

// Service worker registration disabled to prevent online/offline notifications
// Uncomment below to enable offline support and caching
// serviceWorkerRegistration.register({
//   onSuccess: () => {
//     console.log('Service worker registered successfully');
//   },
//   onUpdate: () => {
//     console.log('New content is available; please refresh.');
//   },
// });

// 개발 환경에서 Service Worker 캐시 제거
if (import.meta.env.DEV) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('[DEV] Service Worker unregistered');
      }
    });
  }
  
  // 캐시 스토리지 제거
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
        console.log(`[DEV] Cache '${name}' cleared`);
      });
    });
  }
}

// HMR 감시 (개발 환경에서만)
if (import.meta.hot) {
  if (import.meta.env.DEV) {
    console.log('[HMR] Development server connected');
  }
  
  import.meta.hot.accept(() => {
    if (import.meta.env.DEV) {
      console.log('[HMR] Hot module replacement triggered');
    }
  });

  import.meta.hot.on('vite:beforeUpdate', () => {
    if (import.meta.env.DEV) {
      console.log('[HMR] Before update - file changed detected');
    }
  });

  import.meta.hot.on('vite:afterUpdate', () => {
    if (import.meta.env.DEV) {
      console.log('[HMR] After update - changes applied');
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
