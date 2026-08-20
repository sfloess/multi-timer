# Multi Timer Application - User Guide

Welcome to the official User Guide for **Multi Timer**, a powerful, multi-platform productivity utility designed to manage multiple independent countdown timers simultaneously. Whether you are timing multi-stage cooking, tracking pomodoro work sessions, managing laboratory experiments, or monitoring server deployments, Multi Timer provides a sleek, unified experience across mobile, desktop, web, and terminal environments.

---

## 1. Getting Started

Multi Timer is built to run everywhere you work. Choose your platform below to get installed and up and running in minutes.

### Installation Options

#### Android (APK Sideload)
1. Download the latest `.apk` file from the official release page.
2. Open your Android device's **Settings > Security** (or **Apps & Notifications > Special App Access**).
3. Enable **Install Unknown Apps** for your file manager or browser.
4. Tap the downloaded `.apk` file and select **Install**.

#### iOS (TestFlight)
1. Install **Apple TestFlight** from the iOS App Store.
2. Tap the official Multi Timer TestFlight invitation link on your iOS device.
3. Tap **Accept**, then tap **Install** to download the latest beta build.

#### Web (Npm / Expo)
To run the web version locally or host it on your own server:
1. Ensure Node.js (v18+) is installed.
2. Clone the repository and navigate to the web directory (`cd packages/web` or your specific web project directory).
3. Run `npm install` to install dependencies.
4. Start the web app using Expo:
   ```bash
   npx expo start --web
   ```
5. Open `http://localhost:8081` in any modern desktop or mobile browser.

#### Windows (WPF / .NET)
1. Download the latest `MultiTimer-Setup.exe` or download the source code.
2. To run directly from the source using the .NET SDK:
   ```bash
   dotnet run --project MultiTimer.WPF.csproj
   ```
3. Alternatively, launch the executable to run the native WPF app.

#### macOS & Linux Terminal (Python Curses)
For terminal enthusiasts who prefer lightweight CLI productivity tools:
1. Ensure Python 3.9+ and `pip` are installed.
2. Install via PyPI:
   ```bash
   pip install multitimer-curses
   ```
   *(Note for Windows users: If you are running the curses version on Windows, ensure you also install the companion package via `pip install windows-curses`.)*
3. Launch the app directly from your terminal:
   ```bash
   multitimer
   ```

#### Desktop (Java Swing)
1. Ensure Java Runtime Environment (JRE 17 or higher) is installed on your system.
2. Download `multitimer.jar`.
3. Launch via terminal or command prompt:
   ```bash
   java -jar multitimer.jar
   ```
   *(If your environment lacks an explicit manifest Main-Class definition, run with the explicit class fallback: `java -cp multitimer.jar com.multitimer.Main`)*
4. On Windows and macOS, you can also double-click the `.jar` file directly.

---

### First Launch Experience

When you open Multi Timer for the first time, you will be greeted by a dark interface accented with deep blue highlights. 

* **Default Theme**: A rich dark background (`#0F172A`) paired with elevated cards (`#1E293B`) and crisp vibrant accents (`#3B82F6`).
* **Toolbar**: Located at the top of the app (or top header in terminal mode), providing quick action icons for adding timers, reordering, deleting, and settings.
* **Empty State**: If no saved timers exist, the app displays an **Add Timer** prompt in the center of the screen to help you build your first countdown timer.

---

## 2. Creating and Managing Timers

Multi Timer organizes your workflow into independent countdown cards displayed in a responsive grid or scrollable list.

```
+-------------------------------------------------------------+
| [ + Add Timer ]  [ ^ Move Up ]  [ v Move Down ]  [ Clear All ]|
+-------------------------------------------------------------+
| +---------------------------------------------------------+ |
| |  [Task Name]  Focus Session             [ Edit Notes ] | |
| |  00 : 25 : 00                                          | |
| |  [ Start ]   [ Pause ]   [ Reset ]   [ Delete ]        | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

### Adding a New Timer
* **GUI (Mobile/Web/Desktop)**: Click or tap the **+ Add Timer** button on the top toolbar.
* **Terminal (Curses)**: Press the `a` key on your keyboard.

### Setting Timer Duration
When creating or editing a timer, a time picker popover or modal appears:
1. Enter or adjust the **Hours (HH)**, **Minutes (MM)**, and **Seconds (SS)** fields.
2. Minimum allowed duration: `00:00:01`.
3. Maximum allowed duration: `99:59:59`.
4. Click **Save** or press **Enter** to commit the duration.

### Naming / Renaming Timers
* Click directly on the default title (e.g., *Timer 1*) to activate inline editing.
* Type a descriptive name (e.g., *Bake Pizza*, *Code Review*, *Tea Steeping*).
* Press **Enter** or tap outside the text field to save the name.

### Starting, Pausing, and Resuming Timers
* **Start**: Click the green **Start** button (or press `Enter`/`Space` in Curses) to begin the countdown.
* **Pause**: Click **Pause** to freeze the countdown at its current value.
* **Resume**: Click **Start** again while paused to continue counting down.

### Resetting Timers
Clicking the **Reset** button (or pressing `r` in Curses) immediately stops the timer and restores the digital display to its original set duration.

### Deleting Timers
* **Single Delete**: Select the card and click the **Trash** icon or press `d` in the terminal interface.
* **Confirmation Prompt**: A confirmation dialog prevents accidental deletion if enabled in settings.

---

## 3. Timer Features

### Digital Clock Display
Each timer features an extra-large, high-contrast digital readout formatted standard as `HH:MM:SS`. 
* When the remaining duration is under 1 minute, the display switches to highlight seconds with high precision.
* Active timers run independently on background clock threads, ensuring accuracy even under heavy system load.

### Timer Notes
Every timer includes an expandable **Notes** panel to hold instructions, recipes, task breakdowns, or reference links:
1. Click **Notes** (or press `n` in Curses) on a timer card.
2. A note drawer opens allowing multi-line plain text editing.
3. Click **Done** or save your text. A small document icon appears on the card whenever notes are present.

### Reordering Timers
Keep high-priority tasks at the top of your screen:
* **Toolbar Buttons**: Select a timer card and click **Move Up** or **Move Down**.
* **Drag-and-Drop**: On Web, Desktop GUI apps, click and hold the drag handle on the left of any card and drag it into position. On touch devices (iOS/Android), long-press the drag handle until the card elevates, then drag up or down to reorder.
* **Terminal**: Highlight a card and use keyboard shortcut combinations (`Shift + Up` / `Shift + Down`).

### Clear All Timers
To wipe your workspace clean:
1. Click **Clear All** on the top toolbar.
2. Confirm the action in the pop-up warning dialog.
3. All running and paused timers will be safely stopped and removed.

---

## 4. Alerts and Notifications

Multi Timer ensures you never miss a completed countdown, regardless of whether the app is focused, minimized, or running in the background.

```
+-------------------------------------------------------------+
|  [!] TIMER EXPIRED: "Bake Pizza"                            |
|  Duration: 00:15:00 completed at 18:45:00                    |
|  [ Dismiss ]                                 [ Reset Timer ]|
+-------------------------------------------------------------+
```

### Sound Alerts
* When a timer reaches `00:00:00`, the app plays a distinct notification audio chime.
* Audio repeats until explicitly dismissed or reset by the user.

### Push Notifications (Mobile & Desktop)
* **iOS & Android**: Native push notifications display complete timer details even if the device is locked or the app is closed.
* **Windows & macOS**: Banner notifications appear in the OS Notification Center / Action Center.

### Visual Indicators
* **Card Flash**: Upon hitting zero, the timer card background changes dynamically from dark slate to a flashing alert accent (amber/red).
* **Terminal Visual Bell**: In Curses mode, the terminal screen reverses colors or flashes to visually indicate completion even if sound is disabled.

### Platform-Specific Notification Behavior

| Platform | Background Behavior | Sound Type | Visual Cue |
| :--- | :--- | :--- | :--- |
| **Android** | Foreground Service / System Alarm | System Notification Sound | Flashing Card + Heads-up Banner |
| **iOS** | Local Push Notification | APNS Default Sound | Lockscreen Banner + Card Highlight |
| **Web** | Browser Web Notifications API | Web Audio API Chime | Browser Toast + Tab Title Flash |
| **Windows** | Toast Notification Manager | Windows Native Audio | System Notification Center |
| **Curses** | System Bell / Terminal Signal | Terminal Beep (`\a`) | Screen Inversion / Flash |
| **Java Swing** | Desktop SystemTray Notification | Embedded WAV Sound | Window Focus Request + Flash |

---

## 5. Data Storage & Persistence

Multi Timer automatically persists your workspace state in real-time. Whenever you add, rename, reorder, or set duration for a timer, your changes are saved instantly.

### Storage Mechanisms by Platform

```
+------------------+------------------------------------------------+
| Platform         | Persistence Layer                              |
+------------------+------------------------------------------------+
| iOS              | Native UserDefaults / SQLite                   |
| Android          | Expo SQLite / SharedPreferences                |
| Web              | Browser LocalStorage / IndexedDB               |
| Windows (WPF)    | Local AppData JSON (%APPDATA%\MultiTimer)      |
| Java Swing       | User Home Directory JSON (~/.multitimer)       |
| Terminal Curses  | XDG Config Directory (~/.config/multitimer)    |
+------------------+------------------------------------------------+
```

#### Detailed File Locations

* **Windows (WPF)**:  
  `C:\Users\<Username>\AppData\Roaming\MultiTimer\timers.json`
* **Desktop (Java Swing)**:  
  `~/.multitimer/timers.json`
* **Terminal (Python Curses)**:  
  `~/.config/multitimer/config.json`
* **Android / iOS (Expo/React Native)**:  
  Managed internal SQLite database located in `ApplicationSupport/SQLite/multitimer.db`
* **iOS Native Preferences**:  
  Stored in standard app sandbox `UserDefaults`.

### Optional PostgreSQL Database Sync
For users who work across multiple devices, Multi Timer offers real-time cloud synchronization backed by PostgreSQL:
1. Navigate to **Settings > Database Sync**.
2. Enable **PostgreSQL Sync**.
3. Supply your credentials (Host, Port, Database, Username, Password).
4. Save and Test Connection. Once active, timer creation and state changes sync across all connected endpoints.

*(Note: Multi Timer automatically provisions and updates its remote table schemas upon a successful authenticated connection. No manual SQL initialization script is required on your PostgreSQL server beforehand.)*

### Data Migration Between Versions
When updating Multi Timer across releases, internal database schema migrations execute automatically upon initial launch. Your existing timers, local preferences, and notes will be safely preserved and upgraded.

---

## 6. Keyboard Shortcuts

Boost your efficiency using hardware keyboard shortcuts across Desktop and Terminal builds.

### Terminal (Curses) Shortcuts

| Key | Action |
| :--- | :--- |
| `Up` / `Down` | Navigate through timer list |
| `Enter` / `Space` | Toggle Start / Pause on selected timer |
| `a` | Add a new timer |
| `d` | Delete selected timer |
| `n` | Open / Edit notes for selected timer |
| `r` | Reset selected timer to original set duration |
| `t` | Cycle dynamic terminal themes |
| `q` | Quit Multi Timer application |

### Desktop Shortcuts (Windows WPF, Java Swing, Web)

| Key Combination | Action |
| :--- | :--- |
| `Ctrl + N` / `Cmd + N` | Create a new timer |
| `Space` | Toggle Play/Pause on focused timer |
| `Ctrl + R` / `Cmd + R` | Reset focused timer |
| `Delete` / `Backspace` | Delete selected timer card |
| `Ctrl + Shift + C` | Clear all timers |
| `Ctrl + ,` / `Cmd + ,` | Open Settings page |

---

## 7. Theming

Multi Timer is designed around a modern dark UI palette that looks sharp on high-definition monitors and mobile screens while reducing eye strain during long hours.

| Palette Element | Color Hex Code | Preview Description |
| :--- | :--- | :--- |
| **Background Dark** | `#0F172A` | Deep slate canvas background |
| **Elevated Card** | `#1E293B` | Surface container for individual timers |
| **Primary Accent** | `#3B82F6` | Vibrant blue for primary actions and active states |
| **Alert / Warning** | `#EF4444` | High-visibility red for expired timers and deletion actions |

---

## 8. Troubleshooting

If you encounter issues while setting up or running Multi Timer, consult the common troubleshooting scenarios below:

### Browser Audio Policies (Web Version)
* **Symptom**: Timers reach zero, but no sound alert plays when running in Google Chrome, Firefox, or Safari.
* **Cause**: Modern browsers enforce autoplay policies that block web audio contexts until the user has directly interacted with the webpage.
* **Solution**: Click anywhere on the Multi Timer web page or interact with a control button immediately after loading the app to unlock audio playback. Ensure your browser tab is not muted.

### Missing Terminal Package (Windows Curses)
* **Symptom**: Running `multitimer` in a Windows command prompt yields an `ImportError: No module named 'curses'` error.
* **Cause**: Python distributions for Windows do not package the standard Unix `curses` module natively.
* **Solution**: Install the required compatibility layer package by running:
  ```bash
  pip install windows-curses
  ```

### PostgreSQL Connection Failures (Database Sync)
* **Symptom**: Enabling PostgreSQL Sync results in a "Connection Timeout" or "Authentication Failed" error.
* **Cause**: Incorrect credentials, or network firewalls blocking external connections to the database host.
* **Solution**: Verify that your database host allows inbound TCP traffic on your specified port (default `5432`). Ensure that PostgreSQL is configured to accept remote connections (`pg_hba.conf`) and that your firewall rules permit traffic from your client IP address.
