import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { store } from './store';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// Function to clear service worker cache
const clearServiceWorkerCache = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        // Send message to service worker to clear cache
        registration.active.postMessage({ type: 'CLEAR_CACHE' });
        console.log('Sent cache clear request to Service Worker');
      }
    });
  }
};

// Add cache clearing to window object for debugging
(window as any).clearCache = clearServiceWorkerCache;

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data && event.data.type === 'CACHE_CLEARED') {
            console.log('Cache cleared successfully');
            // Reload the page to ensure fresh content
            window.location.reload();
          }
        });
        
        // Check for updates to the Service Worker
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // At this point, the updated precached content has been fetched,
                // but the previous service worker will still serve the older
                // content until all client tabs are closed.
                console.log('New content is available and will be used when all tabs for this page are closed.');
                
                // Show a notification to the user
                if (window.confirm('New version available! Reload to update?')) {
                  // Clear cache before reloading
                  clearServiceWorkerCache();
                  // Wait a moment for cache clearing to complete
                  setTimeout(() => {
                    window.location.reload(); // Reload the page
                  }, 1000);
                }
              } else {
                // At this point, everything has been precached.
                console.log('Content is cached for offline use.');
              }
            }
          };
        };
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
