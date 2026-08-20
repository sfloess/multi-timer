import Foundation

struct TimerModel: Identifiable, Codable {
    var id: UUID
    var title: String
    var initialDuration: TimeInterval
    var remainingTime: TimeInterval
    var notes: String
    var isRunning: Bool
    var lastUpdated: Date?

    init(
        id: UUID = UUID(),
        title: String = "New Timer",
        duration: TimeInterval = 0,
        notes: String = ""
    ) {
        self.id = id
        self.title = title
        self.initialDuration = duration
        self.remainingTime = duration
        self.notes = notes
        self.isRunning = false
        self.lastUpdated = nil
    }

    var hours: Int {
        Int(remainingTime) / 3600
    }

    var minutes: Int {
        (Int(remainingTime) % 3600) / 60
    }

    var seconds: Int {
        Int(remainingTime) % 60
    }

    var progress: Double {
        guard initialDuration > 0 else { return 0 }
        // Clamp to [0, 1] to avoid values outside the valid range
        return max(0.0, min(1.0, 1.0 - (remainingTime / initialDuration)))
    }

    var timeDisplay: String {
        // Use DateComponentsFormatter for clean, locale‑aware formatting
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.hour, .minute, .second]
        formatter.unitsStyle = .positional
        formatter.zeroFormattingBehavior = .pad

        // `ceil` ensures we don't show "00:00" while the timer is still ticking down the last fraction of a second
        let total = ceil(remainingTime)
        return formatter.string(from: total) ?? "00:00"
    }
}
