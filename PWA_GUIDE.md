# PWA Guide for Airport-5

This guide explains how to work with the PWA (Progressive Web App) functionality in the Airport-5 application, including how to test locally, deploy to GitHub Pages, and troubleshoot common issues.

## Table of Contents

1. [Understanding the Caching Behavior](#understanding-the-caching-behavior)
2. [Clearing Browser Cache](#clearing-browser-cache)
3. [Local Testing](#local-testing)
4. [Deployment to GitHub Pages](#deployment-to-github-pages)
5. [Troubleshooting](#troubleshooting)

## Understanding the Caching Behavior

The application uses a service worker to cache resources for offline use. We've implemented a hybrid caching strategy:

- **Static assets** (images, offline page, etc.) use a **cache-first** strategy
- **Dynamic content** (HTML, JS, CSS) uses a **network-first** strategy

This approach ensures that:
1. Static resources load quickly from cache
2. Dynamic content is always up-to-date when online
3. The app works offline with the most recent content

## Clearing Browser Cache

If you experience issues with cached content, you can clear the cache in several ways:

### Method 1: Using the App's Built-in Cache Clearing

The app now includes a built-in cache clearing function. Open your browser console and run:

```javascript
window.clearCache()
```

This will send a message to the service worker to clear its cache and reload the page.

### Method 2: Using Browser DevTools

#### Chrome
1. Open DevTools (F12 or Ctrl+Shift+I)
2. Go to Application tab → Clear Storage
3. Check all boxes and click "Clear site data"

#### Firefox
1. Open DevTools (F12)
2. Go to Storage tab → Clear Storage
3. Check "Cache" and click "Clear"

#### Edge
Similar to Chrome, use DevTools → Application → Clear Storage

### Method 3: Hard Refresh

Press Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac) to perform a hard refresh that bypasses the cache.

## Local Testing

To test the PWA locally:

1. Run the consolidated PWA script:
   ```
   npm run deploy:pwa
   ```

2. Select option 1 for local testing

3. The script will display your local IP address that you can use to access the app from mobile devices on the same network

4. Follow the on-screen instructions to install the PWA on your device

## Deployment to GitHub Pages

To deploy the PWA to GitHub Pages:

1. Run the consolidated PWA script:
   ```
   npm run deploy:pwa
   ```

2. Select option 2 for GitHub Pages deployment

3. Enter your GitHub username when prompted

4. The script will:
   - Update package.json with the correct homepage URL
   - Update manifest.json with the correct paths for GitHub Pages
   - Build the app
   - Deploy to GitHub Pages

5. Follow the on-screen instructions to install the PWA on your device

## Troubleshooting

### Different Versions Between localhost:3000 and localhost:3000/airport-5

This issue has been fixed by:
1. Updating the service worker to use a network-first strategy for dynamic content
2. Fixing path inconsistencies in manifest.json
3. Adding proper cache versioning

### App Not Working Offline

If the app doesn't work offline:

1. Make sure you've installed it as a PWA (look for the standalone window)
2. Check that the service worker is registered (look for "Service Worker registered" in the console)
3. Verify that localStorage is working (check for "Data saved for offline use" messages)

### Data Not Persisting Between Sessions

The app uses localStorage to persist data. If data isn't persisting:

1. Check if localStorage is available in your browser
2. Make sure you're not in incognito/private browsing mode
3. Verify that you have sufficient storage space

### PWA Not Installing

If you can't install the PWA:

1. Make sure you're using a supported browser (Chrome, Edge, or Firefox)
2. Visit the site for at least 30 seconds before attempting to install
3. Check that the manifest.json is being loaded correctly (no 404 errors)
4. Verify that the service worker is registered successfully

## Advanced: Manual Service Worker Control

For developers who need more control over the service worker:

1. Register/unregister the service worker:
   ```javascript
   // Register
   navigator.serviceWorker.register('./service-worker.js')
   
   // Unregister
   navigator.serviceWorker.getRegistrations().then(function(registrations) {
     for(let registration of registrations) {
       registration.unregister()
     }
   })
   ```

2. Clear the cache manually:
   ```javascript
   caches.keys().then(function(names) {
     for (let name of names) caches.delete(name);
   })
   ```

3. Force update the service worker:
   ```javascript
   navigator.serviceWorker.ready.then(registration => {
     registration.update();
   })