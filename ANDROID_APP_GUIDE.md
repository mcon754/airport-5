# Creating an Android APK from your PWA

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

```bash
npm install -g @bubblewrap/cli
```

### Step 2: Initialize a new TWA project

```bash
bubblewrap init --manifest https://your-deployed-pwa-url/manifest.json
```

Follow the prompts to configure your app.

### Step 3: Build the APK

```bash
bubblewrap build
```

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

```gradle
dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.3.0'
}
```

### Step 3: Configure the TWA

1. Create a new resource file: res/values/strings.xml
2. Add your PWA URL:

```xml
<resources>
    <string name="app_name">Task Manager</string>
    <string name="pwa_url">https://your-deployed-pwa-url/</string>
</resources>
```

3. Update AndroidManifest.xml:

```xml
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
```

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
