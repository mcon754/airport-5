// This script detects if the app is running as an installed PWA
(function() {
  // Check if the app is running in standalone mode (installed PWA)
  const isInStandaloneMode = () => 
    (window.matchMedia('(display-mode: standalone)').matches) || 
    (window.navigator.standalone) || 
    document.referrer.includes('android-app://');

  // Function to show a notification
  const showNotification = (message, isError = false) => {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.backgroundColor = isError ? '#ff5252' : '#4caf50';
    notification.style.color = 'white';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  };

  // When the page loads
  window.addEventListener('DOMContentLoaded', () => {
    // Check if running as installed PWA
    if (isInStandaloneMode()) {
      console.log('Running as installed PWA');
      // Add a class to the body for PWA-specific styling
      document.body.classList.add('pwa-mode');
      
      // Show a notification only on the first load
      if (!localStorage.getItem('pwa-installed-notification-shown')) {
        showNotification('App successfully installed!');
        localStorage.setItem('pwa-installed-notification-shown', 'true');
      }
    } else {
      console.log('Running in browser mode');
      
      // Show installation prompt if not already shown in this session
      if (!sessionStorage.getItem('install-prompt-shown')) {
        setTimeout(() => {
          const installPrompt = document.createElement('div');
          installPrompt.innerHTML = `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background-color: #4c97ea; color: white; padding: 15px; text-align: center; z-index: 9999; box-shadow: 0 -2px 10px rgba(0,0,0,0.2);">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Install this app on your phone</p>
              <p style="margin: 0 0 10px 0;">Tap the menu button and then "Add to Home Screen" to install</p>
              <button id="close-install-prompt" style="background-color: white; color: #4c97ea; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">Got it</button>
            </div>
          `;
          document.body.appendChild(installPrompt);
          
          document.getElementById('close-install-prompt').addEventListener('click', () => {
            document.body.removeChild(installPrompt);
          });
          
          sessionStorage.setItem('install-prompt-shown', 'true');
        }, 3000);
      }
    }
    
    // Check for online/offline status
    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        console.log('App is online');
        if (isInStandaloneMode()) {
          showNotification('You are back online');
        }
      } else {
        console.log('App is offline');
        if (isInStandaloneMode()) {
          showNotification('You are offline. Changes will be saved locally.', true);
        }
      }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  });
})();