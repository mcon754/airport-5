const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.cyan}=== Android APK Generator for PWA ===${colors.reset}\n`);
console.log(`${colors.yellow}This script will guide you through creating an Android APK from your PWA.${colors.reset}\n`);

// Create a guide file with detailed instructions
function createGuideFile() {
  const guideContent = `# Creating an Android APK from your PWA

This guide will help you create an Android APK from your Progressive Web App (PWA) using Trusted Web Activities (TWA).

## Prerequisites

1. [Node.js](https://nodejs.org/) (already installed if you're running this script)
2. [Android Studio](https://developer.android.com/studio)
3. [Java Development Kit (JDK)](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html)

## Option 1: Using PWA Builder (Easiest)

1. Visit [PWA Builder](https://www.pwabuilder.com/)
2. Enter your deployed PWA URL (must be HTTPS)
3. Click "Build My PWA"
4. Select "Android" package
5. Download the APK
6. Install on your Android device

## Option 2: Using Bubblewrap CLI

### Step 1: Install Bubblewrap CLI

\`\`\`bash
npm install -g @bubblewrap/cli
\`\`\`

### Step 2: Initialize a new TWA project

\`\`\`bash
bubblewrap init --manifest https://your-deployed-pwa-url/manifest.json
\`\`\`

Follow the prompts to configure your app.

### Step 3: Build the APK

\`\`\`bash
bubblewrap build
\`\`\`

### Step 4: Install on your device

Transfer the APK to your Android device and install it.

## Option 3: Using Android Studio

### Step 1: Create a new Android project

1. Open Android Studio
2. Create a new project with an "Empty Activity"
3. Configure your project:
   - Name: Task Manager
   - Package name: com.example.taskmanager
   - Language: Java or Kotlin
   - Minimum SDK: API 19

### Step 2: Add TWA dependencies

Add these to your app's build.gradle:

\`\`\`gradle
dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.3.0'
}
\`\`\`

### Step 3: Configure the TWA

1. Create a new resource file: res/values/strings.xml
2. Add your PWA URL:

\`\`\`xml
<resources>
    <string name="app_name">Task Manager</string>
    <string name="pwa_url">https://your-deployed-pwa-url/</string>
</resources>
\`\`\`

3. Update AndroidManifest.xml:

\`\`\`xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.taskmanager">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.NoActionBar">

        <meta-data
            android:name="asset_statements"
            android:resource="@string/asset_statements" />

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
\`\`\`

### Step 4: Build and run

1. Build the APK (Build > Build Bundle(s) / APK(s) > Build APK(s))
2. Install on your device

## Troubleshooting

If you encounter issues:

1. Make sure your PWA is properly configured with a valid manifest.json
2. Ensure your PWA is deployed to an HTTPS URL
3. Check that your Android device allows installation from unknown sources
4. Verify that Android Studio and JDK are properly installed

## Resources

- [PWA Builder](https://www.pwabuilder.com/)
- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [Trusted Web Activities Overview](https://developer.chrome.com/docs/android/trusted-web-activity/)
`;

  fs.writeFileSync('ANDROID_APP_GUIDE.md', guideContent);
  console.log(`${colors.green}Created ANDROID_APP_GUIDE.md with detailed instructions${colors.reset}\n`);
}

// Create a simple HTML file to demonstrate the app in a standalone window
function createStandaloneDemo() {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Standalone App Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
      color: #333;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .app-header {
      background-color: #4c97ea;
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .app-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    
    .app-content {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }
    
    .task-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .task-item {
      background-color: white;
      border-radius: 8px;
      margin-bottom: 8px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .app-footer {
      background-color: #f9f9f9;
      padding: 16px;
      text-align: center;
      border-top: 1px solid #eaeaea;
      font-size: 14px;
      color: #666;
    }
    
    .standalone-indicator {
      position: fixed;
      top: 0;
      right: 0;
      background-color: #4c97ea;
      color: white;
      padding: 4px 8px;
      font-size: 12px;
      border-bottom-left-radius: 8px;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div class="standalone-indicator">Standalone App</div>
  
  <header class="app-header">
    <h1 class="app-title">Task Manager</h1>
    <div>
      <button id="add-task">+</button>
    </div>
  </header>
  
  <main class="app-content">
    <ul class="task-list">
      <li class="task-item">Complete project documentation</li>
      <li class="task-item">Fix PWA installation issues</li>
      <li class="task-item">Create Android APK version</li>
      <li class="task-item">Test on multiple devices</li>
    </ul>
  </main>
  
  <footer class="app-footer">
    Task Manager App - Standalone Mode
  </footer>
  
  <script>
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');
    
    // Show or hide the standalone indicator
    document.querySelector('.standalone-indicator').style.display = isStandalone ? 'block' : 'none';
    
    // Add a message if not in standalone mode
    if (!isStandalone) {
      const banner = document.createElement('div');
      banner.style.position = 'fixed';
      banner.style.bottom = '0';
      banner.style.left = '0';
      banner.style.right = '0';
      banner.style.backgroundColor = '#4c97ea';
      banner.style.color = 'white';
      banner.style.padding = '16px';
      banner.style.textAlign = 'center';
      banner.style.zIndex = '1000';
      banner.innerHTML = 'Add to Home Screen for a standalone app experience';
      document.body.appendChild(banner);
    }
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync('standalone-demo.html', htmlContent);
  console.log(`${colors.green}Created standalone-demo.html${colors.reset}`);
  console.log(`${colors.yellow}Open this file in your browser to see how the app would look in standalone mode${colors.reset}\n`);
  
  // Try to open the file in the default browser
  try {
    const openCommand = process.platform === 'win32' ? 'start' : 
                        process.platform === 'darwin' ? 'open' : 'xdg-open';
    execSync(`${openCommand} standalone-demo.html`);
  } catch (e) {
    console.log(`${colors.yellow}Please open the file manually: ${path.resolve('standalone-demo.html')}${colors.reset}`);
  }
}

// Main function
function main() {
  console.log(`${colors.bright}${colors.cyan}Options for creating an Android app:${colors.reset}\n`);
  
  console.log(`${colors.yellow}1. PWA Builder (Recommended)${colors.reset}`);
  console.log(`   Visit https://www.pwabuilder.com/ and enter your deployed PWA URL`);
  console.log(`   This will generate an Android APK file you can install directly\n`);
  
  console.log(`${colors.yellow}2. Bubblewrap CLI${colors.reset}`);
  console.log(`   Use Google's Bubblewrap tool to create a TWA (Trusted Web Activity)`);
  console.log(`   npm install -g @bubblewrap/cli\n`);
  
  console.log(`${colors.yellow}3. Android Studio${colors.reset}`);
  console.log(`   Create a native Android app that loads your PWA in a WebView\n`);
  
  // Create the guide file
  createGuideFile();
  
  // Create the standalone demo
  createStandaloneDemo();
  
  console.log(`${colors.bright}${colors.cyan}Next steps:${colors.reset}`);
  console.log(`1. Deploy your PWA to a public HTTPS URL`);
  console.log(`2. Follow the instructions in ANDROID_APP_GUIDE.md`);
  console.log(`3. Install the resulting APK on your Android device\n`);
  
  console.log(`${colors.bright}${colors.green}This will provide a true native app experience!${colors.reset}`);
}

// Run the main function
main();