# Task Manager PWA

A simple task management application that can be installed as a Progressive Web App (PWA) on your Android phone.

## Features

- Create, edit, and delete tasks
- Organize tasks with subtasks
- Drag and drop to reorder tasks
- Swipe to delete tasks
- Full offline functionality with local data storage
- Installable as a standalone app on mobile devices
- Proper standalone app experience (not just a browser shortcut)

## Installation on Android

### Important: Deploy to GitHub Pages First

For the best PWA installation experience, deploy your app to GitHub Pages:

```
npm run deploy:github
```

This will:
1. Prompt for your GitHub username
2. Update package.json with the correct homepage URL
3. Build and deploy your app to GitHub Pages
4. Provide a public HTTPS URL for your app

Once deployed, you can install the PWA properly:

1. Open Chrome on your Android device
2. Navigate to your GitHub Pages URL (e.g., https://yourusername.github.io/airport-5)
3. Tap the menu (three dots) and select "Install app" or "Add to Home Screen"
4. Confirm the installation

**For detailed step-by-step instructions with troubleshooting tips, see the [Detailed Installation Guide](./INSTALL_GUIDE.md).**

### Testing with Local Development Server

To test the PWA installation from your local development server:

1. Make sure your Android device and computer are on the same network
2. Run the PWA test script:
   ```
   npm run pwa
   ```
3. This will display your computer's IP address and instructions
4. On your Android device, open Chrome and navigate to the URL shown (e.g., `http://192.168.1.x:3000`)
5. Follow the installation steps from the [Detailed Installation Guide](./INSTALL_GUIDE.md)

### Verifying Proper Installation

When properly installed, the app should:
- Open in its own window (not in the browser)
- Not show any browser address bar or navigation controls
- Display "Installed App" indicator in the top-right corner
- Show a notification saying "App successfully installed!"
- Work offline with full functionality

## Deployment Options

### GitHub Pages

1. Install the gh-pages package:
   ```
   npm install --save-dev gh-pages
   ```

2. Add your repository URL to package.json:
   ```json
   "homepage": "https://yourusername.github.io/repo-name"
   ```

3. Deploy:
   ```
   npm run deploy
   ```

### Netlify

1. Install Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Deploy:
   ```
   netlify deploy
   ```

3. Follow the prompts to complete deployment

### Firebase

1. Install Firebase tools:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Initialize Firebase hosting:
   ```
   firebase init hosting
   ```

4. Deploy:
   ```
   firebase deploy
   ```

### Vercel

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy:
   ```
   vercel
   ```

3. Follow the prompts to complete deployment

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run deploy` - Deploys the app to GitHub Pages
- `npm run deploy:script` - Runs the deployment script with additional guidance

### PWA Features

This app is configured as a Progressive Web App with:

- Service worker for offline functionality
- Web app manifest for installation
- Responsive design for mobile devices
- Proper meta tags for iOS and Android

### PWA Icon Generation

To ensure proper installation, the app needs correctly sized icons:

```
npm run generate:icons
```

This will provide instructions for creating proper PWA icons using various methods.

For a quick solution with simple colored icons:

```
npm run generate:simple-icons
```

This will open a browser page that generates and downloads simple task-themed icons.

## Troubleshooting

If you're having trouble installing the PWA:

1. Make sure you're using Chrome on Android (version 76 or later)
2. Ensure the site is served over HTTPS (except for localhost)
3. Visit the site a few times to trigger the install prompt
4. Clear your browser cache if you've made updates to the PWA configuration
5. If the app doesn't work offline, try these steps:
   - Close all instances of the app
   - Clear the browser cache
   - Reinstall the app
   - Open the app and let it fully load while online
   - Then try using it offline

For more detailed troubleshooting steps, see the [Detailed Installation Guide](./INSTALL_GUIDE.md).

## Offline Functionality

This app is designed to work fully offline:

- All app resources are cached during the first load
- Your tasks are stored in the browser's local storage
- Changes made offline will be saved locally
- When you go back online, the app will continue to work seamlessly
- A special offline page will be shown if you try to access uncached resources while offline

## Android App Creation

If you prefer a true native app experience instead of a PWA, you can create an Android APK:

```
npm run create:android-app
```

This will:
1. Create an ANDROID_APP_GUIDE.md with detailed instructions
2. Generate a standalone-demo.html to preview the app in standalone mode
3. Provide options for creating an Android APK:
   - Using PWA Builder (easiest)
   - Using Bubblewrap CLI
   - Using Android Studio

The resulting APK can be installed directly on Android devices without relying on browser-based PWA installation.
