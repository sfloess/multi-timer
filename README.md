# ⏱️ Multi-Timer Pro

[![React Native](https://img.shields.io/badge/React%20Native-Cross%2C%20Web%2C%20Android%2C%20iOS-blue?logo=react)](#1-react-native--expo-root-application)
[![Java Swing](https://img.shields.io/badge/Java-Swing%20Desktop-orange?logo=java)](#2-java-swing-java-desktop)
[![Python Curses](https://img.shields.io/badge/Python-Curses%20Terminal-yellow?logo=python)](#3-python-curses-terminal-app)
[![SwiftUI](https://img.shields.io/badge/Swift-SwiftUI%20iOS-purple?logo=apple)](#4-ios-swiftui-native-ios)
[![WPF .NET 8](https://img.shields.io/badge/C%23-WPF%20Windows-informational?logo=dotnet)](#5-windows-wpf-c----net-8)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A robust, feature-rich multi-timer application designed for productivity, cooking, interval training, and task management. Run multiple independent timers simultaneously, add notes, reorder your workflow, and never miss a deadline with reliable audio-visual alerts. 

Built natively across multiple platforms to ensure you can track time wherever you work—from mobile and web to the terminal and desktop.

---

## ✨ Features

- **Multiple Independent Timers**: Run as many timers as you need in a clean, scrollable list or grid view.
- **Full Timer Controls**: Each timer includes an editable name, precise digital clock display (`HH:MM:SS`), and dedicated Start, Pause, and Reset buttons.
- **Intuitive Time Picker**: Easily set durations using hour, minute, and second inputs.
- **Timer Notes**: Add, edit, and reference personal notes directly inside each timer card.
- **Global Toolbar**: Quickly Add new timers, Delete selected ones, Move timers up/down to reorder your list, or Clear all at once.
- **Alert & Notification System**: Triggers an unmistakable visual flash and sound alert when any timer reaches zero.
- **Automatic Data Persistence**: Never lose your setup—all timer states, notes, and positions are automatically saved and reloaded on startup.
- **Modern Dark Theme**: Styled with a sleek blue accent palette (`#3B82F6` primary, `#0F172A` background, `#1E293B` cards) across all implementations.

---

## 📱 Platform Support

| Platform | Technology | Status | Run Command / Entry Point |
| :--- | :--- | :--- | :--- |
| **Cross-Platform** (Android, iOS, Web) | React Native / Expo | 🟢 Stable | `npx expo start` |
| **Android (APK)** | React Native / Expo | 🟢 Ready | Download via GitHub Releases |
| **Windows Desktop** | C# / WPF (.NET 8) | 🟢 Stable | `dotnet run` (in `/windows/`) |
| **Java Desktop** | Java Swing | 🟢 Stable | `java -jar target/multi-timer-1.0.0-shaded.jar` |
| **iOS Native** | Swift / SwiftUI | 🟢 Stable | Open `/ios/` in Xcode |
| **Terminal / CLI** | Python Curses | 🟢 Stable | `python -m multi_timer` (in `/curses/`) |

---

## 🖼️ Screenshots

*(Placeholders)*
| Main Dashboard (Cross-Platform) | Timer Picker & Notes | Terminal View (Curses) |
| :---: | :---: | :---: |
| `[ Screenshot 1: Dark theme grid layout with active timers ]` | `[ Screenshot 2: Setting timer duration and adding notes ]` | `[ Screenshot 3: Terminal curses theme interface ]` |

---

## 🛠️ Prerequisites

Before getting started, ensure you have the appropriate toolchains installed depending on the platform(s) you plan to run:
- **Node.js** (LTS recommended) and npm/Yarn – required for the React Native / Expo cross-platform app.
- **Java JDK** (version 17 or higher) and Maven – required for the Java Swing desktop app.
- **Python** (version 3.8 or higher) and pip – required for the Python Curses terminal app.
- **Xcode** (latest version on macOS) – required for the iOS SwiftUI app.
- **.NET 8 SDK** – required for the Windows WPF desktop app.

---

## 🚀 How to Run

### 1. React Native / Expo (Root Application)
The primary cross-platform application supporting Android, iOS, and Web.
```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on specific platforms
npm run android
npm run ios
npm run web

# Build Android APK locally using EAS
eas build --platform android --profile preview
```

### 2. Java Swing (Java Desktop)
Self-contained desktop application powered by Maven and FlatLaf.
```bash
cd swing
# Package into a runnable shaded JAR
mvn clean package
# Run the application
java -jar target/multi-timer-1.0.0-shaded.jar
```

### 3. Python Curses (Terminal App)
Lightweight terminal user interface utilizing the `flossware-curses-themes` library.
```bash
cd curses
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install package and dependencies in editable mode
pip install -e .

# Run the application
python -m multi_timer
# Tip: Press 't' to toggle built-in curses themes
```

### 4. iOS SwiftUI (Native iOS)
Requires macOS and Xcode.
```bash
cd ios
# Open the project workspace in Xcode
open MultiTimer.xcodeproj
# Note: Use Xcode's native build and run buttons (Cmd + R) to launch the SwiftUI app in your simulator or target device.
```

### 5. Windows WPF (C# / .NET 8)
Requires the .NET 8 SDK installed on Windows.
```bash
cd windows
# Run directly
dotnet run
# Publish as a standalone, self-contained executable
dotnet publish -c Release -r win-x64 --self-contained true
```

---

## 💾 Database & Storage Support

Multi-Timer Pro ensures your workflow is never interrupted by saving your configuration locally (and optionally syncing remotely).

### Storage Architecture by Platform:
- **Expo / React Native (Main App)**: Uses `expo-sqlite` for robust local relational storage. Includes a built-in migration system to handle schema updates safely.
- **Java Swing, Curses, & Windows WPF**: Utilizes lightweight, reliable **JSON file persistence** stored in user application data directories (`~/.multitimers.json` or platform equivalent).
- **iOS (SwiftUI)**: Leverages `UserDefaults` and local property lists for fast native state preservation.

### Optional Cloud Sync:
- **PostgreSQL Sync**: The main Expo application includes an optional settings page to plug in your remote PostgreSQL connection string, backing up timer configurations to the cloud.

### What Data is Saved?
For every timer, the application serializes:
- Timer ID & Position Index
- Editable Name / Label
- Target Duration (Hours, Minutes, Seconds)
- Remaining Time (for pause/resume states)
- Active State (Running, Paused, Completed)
- Custom Notes

---

## ⚙️ Configuration Setup

- **Expo (`/`)**: Configured via `app.json` (metadata, bundle identifiers, permissions) and `eas.json` (build profiles for development, preview, and production).
- **Java Swing (`/swing/`)**: Managed via `pom.xml` dependencies and FlatLaf Look-and-Feel initializations located in `Main.java`.
- **Python Curses (`/curses/`)**: Configured in `pyproject.toml`. Theme customizations and keybindings can be adjusted dynamically via the `curses-themes` module integration (press `t` in-app to cycle themes).
- **iOS SwiftUI (`/ios/`)**: Uses `Info.plist` for app metadata and requests notification permissions for background alerts.
- **Windows WPF (`/windows/`)**: Configured via `MultiTimer.csproj` and application settings properties for window dimensions and theme resources.

---

## 🤝 Contributing

Contributions are always welcome! Whether it's reporting a bug, proposing a feature, or submitting a pull request, please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👏 Credits

All code, platform implementations, and architecture designs within this multi-platform project were generated by free AI models via **FreeModelRouter**.
