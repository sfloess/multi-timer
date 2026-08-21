# Multi Timer - User Guide

A cross-platform multi-timer application for managing multiple independent countdown timers. Available on Android, iOS, Windows, Java Desktop, and Linux Terminal.

---

## 1. Getting Started

### Installation

#### Android (APK)
1. Download `multi-timer.apk` from [GitHub Releases](https://github.com/sfloess/multi-timer/releases).
2. On your device, go to **Settings > Security** and enable **Install Unknown Apps** for your file manager.
3. Tap the downloaded APK and select **Install**.

#### iOS (SwiftUI)
1. Open the `swiftui/` directory in Xcode on macOS.
2. Select your target device or simulator.
3. Press **Cmd+R** to build and run.

#### Windows (WPF .NET 8)
1. Download `MultiTimer.exe` from [GitHub Releases](https://github.com/sfloess/multi-timer/releases).
2. Double-click to run (self-contained, no .NET installation needed).

Or build from source:
```bash
cd windows
dotnet run
```

#### Java Desktop (Swing)
1. Download `multi-timer.jar` from [GitHub Releases](https://github.com/sfloess/multi-timer/releases).
2. Run with Java 17+:
```bash
java -jar multi-timer.jar
```

#### Linux Terminal (Python Curses)
1. Download the `multi-timer` binary from [GitHub Releases](https://github.com/sfloess/multi-timer/releases), or install from source:
```bash
cd curses
pip install -e .
python -m multi_timer
```

### First Launch

All platforms open with a dark theme interface. If no saved timers exist, click **Add** (or press `a` in the terminal) to create your first timer.

---

## 2. Creating and Managing Timers

```
+-------------------------------------------------------------+
| [ + Add ]  [ Delete ]  [ Move Up ]  [ Move Down ] [ Clear ] |
+-------------------------------------------------------------+
| +---------------------------------------------------------+ |
| |  Focus Session                          [Running]       | |
| |  00 : 25 : 00                                          | |
| |  [ Pause ]                    [ Reset ]                 | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

### Adding a Timer
- **GUI platforms**: Click the **Add** button in the toolbar.
- **Terminal**: Press `a`, then enter a name.
- Set the duration using hours, minutes, and seconds fields.

### Timer Controls
| Action | GUI | Terminal (Curses) |
| :--- | :--- | :--- |
| Start/Pause | Click Start/Pause button | `Enter` on selected timer |
| Reset | Click Reset button | `r` |
| Delete | Click Delete in toolbar | `d` |
| Edit Notes | Click Notes button | `n` |
| Move Up/Down | Click arrows in toolbar | Arrow keys to navigate |

### Clear All
Removes all timers. Available via the toolbar button or Settings dialog.

---

## 3. Timer Notes

Each timer supports a text note for instructions, recipes, or task details:

1. Select a timer and open its notes (click the Notes button or press `n`).
2. Enter or edit your text.
3. Save. A note indicator appears on timers that have notes.

---

## 4. Alerts and Notifications

When a timer reaches zero:

| Platform | Sound | Visual |
| :--- | :--- | :--- |
| **Android** | System notification sound | Status bar notification |
| **iOS** | Critical notification sound | Lock screen banner |
| **Windows** | WAV alarm file or system beep | Toast notification |
| **Java Swing** | WAV alarm file or system beep | Window focus request |
| **Terminal** | Terminal bell | Status changes to DONE |

---

## 5. Data Storage

Timer state is saved automatically. Your timers, names, durations, remaining time, and notes persist across restarts.

| Platform | Storage | Location |
| :--- | :--- | :--- |
| **Android** | SharedPreferences | App internal storage |
| **iOS** | UserDefaults | App container |
| **Windows** | JSON / SQLite / PostgreSQL | `%APPDATA%/multi-timer/` |
| **Java Swing** | JSON file | `~/.multi-timer/timers.json` |
| **Terminal** | JSON file | `~/.multi-timer/timers.json` |

### Windows Database Configuration

Windows supports three storage backends, configurable via **Settings**:

1. **JSON** (default): Simple file-based storage.
2. **SQLite**: Local database file.
3. **PostgreSQL**: Remote database for multi-device sync.

PostgreSQL passwords are encrypted at rest using Windows DPAPI.

---

## 6. Keyboard Shortcuts

### Terminal (Curses)

| Key | Action |
| :--- | :--- |
| `Up` / `Down` | Navigate timer list |
| `Enter` | Toggle Start/Pause |
| `a` | Add new timer |
| `d` | Delete selected timer |
| `n` | Edit notes |
| `r` | Reset timer |
| `q` | Quit |

---

## 7. Theming

All platforms use a consistent dark theme:

| Element | Color | Usage |
| :--- | :--- | :--- |
| Background | `#0F172A` | Main canvas |
| Cards | `#1E293B` | Timer card surface |
| Accent | `#38BDF8` | Buttons, active states |
| Running | `#22C55E` | Running timer indicator |
| Paused | `#F59E0B` | Paused timer indicator |
| Alert | `#EF4444` | Finished timer, destructive actions |

---

## 8. Troubleshooting

### Windows: Sound not playing
The app looks for `Resources/Alarm.wav` in its installation directory. If missing, it falls back to the system exclamation sound, then system beep.

### Terminal: `ImportError: No module named 'curses'`
On Windows, install the compatibility package:
```bash
pip install windows-curses
```

### PostgreSQL: Connection timeout
- Verify the host allows inbound TCP on port 5432.
- Check `pg_hba.conf` permits connections from your IP.
- Ensure credentials are correct in the Settings dialog.

### Android: Timer stops in background
Android may kill background processes. The app saves state automatically, so timers resume their correct remaining time on relaunch.

---

## 9. Version History

Version numbers follow X.Y format. See the `VERSION` file and [GitHub Releases](https://github.com/sfloess/multi-timer/releases) for the full changelog.
