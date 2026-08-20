import SwiftUI
import UserNotifications

@main
struct MultiTimerApp: App {
    // The central manager responsible for timer logic and persistence
    // This is injected into the environment for access throughout the app
    @State private var timerManager = TimerManager()

    init() {
        // Request necessary permissions for timer expiration alerts
        requestNotificationPermission()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(timerManager)
                .preferredColorScheme(.dark)
        }
    }

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("Notification permission error: \(error.localizedDescription)")
            } else if granted {
                print("Notification permission granted.")
            }
        }
    }
}
