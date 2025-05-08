// Minimal PWA helper script
(function() {
  // Check if the app is running in standalone mode (installed PWA)
  const isInStandaloneMode = () =>
    (window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator.standalone) ||
    document.referrer.includes('android-app://');

  // When the page loads
  window.addEventListener('DOMContentLoaded', () => {
    // Log standalone mode status (for debugging only)
    if (isInStandaloneMode()) {
      console.log('Running as installed PWA');
    } else {
      console.log('Running in browser mode');
    }
    
    // Basic online/offline logging
    const logOnlineStatus = () => {
      if (navigator.onLine) {
        console.log('App is online');
      } else {
        console.log('App is offline');
      }
    };
    
    window.addEventListener('online', logOnlineStatus);
    window.addEventListener('offline', logOnlineStatus);
  });
})();