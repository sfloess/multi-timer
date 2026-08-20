import Foundation
import UserNotifications

class NotificationService {
    static let shared = NotificationService()

    private init() {}

    /// Schedules a local notification for a specific timer when it is expected to end.
    /// - Parameters:
    ///   - timerId: The unique identifier of the timer.
    ///   - title: The title of the timer for the notification body.
    ///   - secondsRemaining: The time remaining in seconds until the alert should trigger.
    func scheduleNotification(for timerId: UUID, title: String, secondsRemaining: TimeInterval) {
        guard secondsRemaining > 0 else { return }

        let content = UNMutableNotificationContent()
        content.title = "Timer Finished"
        content.body = "Your timer '\(title)' has reached zero."
        content.sound = UNNotificationSound.defaultCritical
        content.badge = 1

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: secondsRemaining, repeats: false)
        let request = UNNotificationRequest(identifier: timerId.uuidString, content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error.localizedDescription)")
            }
        }
    }

    /// Cancels a pending notification for a specific timer.
    /// - Parameter timerId: The unique identifier of the timer.
    func cancelNotification(for timerId: UUID) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [timerId.uuidString])
    }

    /// Clears all pending and delivered notifications for the application.
    func clearAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
    }

    /// Requests user authorization for notifications.
    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("Authorization error: \(error.localizedDescription)")
            }
        }
    }
}
