import Foundation
import UserNotifications
import AVFoundation

@Observable
final class TimerManager {
    var timers: [TimerModel] = [] {
        didSet {
            saveTimers()
        }
    }

    private var cancellableTimer: Timer?
    private var audioPlayer: AVAudioPlayer?
    private let saveKey = "SavedTimersKey"

    init() {
        loadTimers()
        startGlobalEngine()
    }

    deinit {
        cancellableTimer?.invalidate()
    }

    // MARK: - Persistence
    private func saveTimers() {
        if let encoded = try? JSONEncoder().encode(timers) {
            UserDefaults.standard.set(encoded, forKey: saveKey)
        }
    }

    private func loadTimers() {
        if let data = UserDefaults.standard.data(forKey: saveKey),
           let decoded = try? JSONDecoder().decode([TimerModel.self], from: data) {
            self.timers = decoded
            
            // Reconcile background time drift for running timers
            let now = Date()
            for i in 0..<timers.count {
                if timers[i].isRunning, let last = timers[i].lastUpdated {
                    let elapsed = now.timeIntervalSince(last)
                    if timers[i].remainingTime > elapsed {
                        timers[i].remainingTime -= elapsed
                        timers[i].lastUpdated = now
                    } else {
                        timers[i].remainingTime = 0
                        timers[i].isRunning = false
                        timers[i].lastUpdated = nil
                    }
                }
            }
        }
    }

    // MARK: - Engine
    private func startGlobalEngine() {
        cancellableTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            let now = Date()
            let activeIndices = self.timers.indices.filter { self.timers[$0].isRunning }
            
            guard !activeIndices.isEmpty else { return }

            for index in activeIndices {
                if let last = self.timers[index].lastUpdated {
                    let delta = now.timeIntervalSince(last)
                    if delta >= 0.1 {
                        self.timers[index].remainingTime -= delta
                        self.timers[index].lastUpdated = now

                        if self.timers[index].remainingTime <= 0 {
                            self.timers[index].remainingTime = 0
                            self.timers[index].isRunning = false
                            self.timers[index].lastUpdated = nil
                            self.triggerCompletion(for: self.timers[index])
                        }
                    }
                } else {
                    self.timers[index].lastUpdated = now
                }
            }
        }
    }

    // MARK: - Actions
    func addTimer() {
        let newTimer = TimerModel(title: "Timer \(timers.count + 1)", duration: 60)
        timers.append(newTimer)
    }

    func deleteTimers(at offsets: IndexSet) {
        timers.remove(atOffsets: offsets)
    }

    func moveTimers(from source: IndexSet, to destination: Int) {
        timers.move(fromOffsets: source, toOffset: destination)
    }

    func clearAll() {
        timers.removeAll()
    }

    func toggleStartPause(for timerId: UUID) {
        guard let index = timers.firstIndex(where: { $0.id == timerId }) else { return }
        
        if timers[index].isRunning {
            timers[index].isRunning = false
            timers[index].lastUpdated = nil
        } else {
            if timers[index].remainingTime <= 0 {
                timers[index].remainingTime = timers[index].initialDuration
            }
            guard timers[index].remainingTime > 0 else { return }
            timers[index].isRunning = true
            timers[index].lastUpdated = Date()
        }
    }

    func reset(for timerId: UUID) {
        guard let index = timers.firstIndex(where: { $0.id == timerId }) else { return }
        timers[index].isRunning = false
        timers[index].remainingTime = timers[index].initialDuration
        timers[index].lastUpdated = nil
    }

    func updateDuration(for timerId: UUID, duration: TimeInterval) {
        guard let index = timers.firstIndex(where: { $0.id == timerId }) else { return }
        timers[index].initialDuration = duration
        timers[index].remainingTime = duration
        timers[index].isRunning = false
        timers[index].lastUpdated = nil
    }

    func updateTitle(for timerId: UUID, title: String) {
        guard let index = timers.firstIndex(where: { $0.id == timerId }) else { return }
        timers[index].title = title
    }

    func updateNotes(for timerId: UUID, notes: String) {
        guard let index = timers.firstIndex(where: { $0.id == timerId }) else { return }
        timers[index].notes = notes
    }

    // MARK: - Notifications & Sound
    private func triggerCompletion(for timer: TimerModel) {
        playAlarmSound()
        sendLocalNotification(for: timer)
    }

    private func playAlarmSound() {
        if let soundURL = Bundle.main.url(forResource: "alarm", withExtension: "wav") {
            do {
                audioPlayer = try AVAudioPlayer(contentsOf: soundURL)
                audioPlayer?.play()
            } catch {
                print("Failed to play custom sound, falling back to system sound.")
                AudioServicesPlaySystemSound(1005)
            }
        } else {
            AudioServicesPlaySystemSound(1005)
        }
    }

    private func sendLocalNotification(for timer: TimerModel) {
        let content = UNMutableNotificationContent()
        content.title = "Timer Finished!"
        content.body = "Your timer '\(timer.title)' has finished."
        content.sound = UNNotificationSound.default

        let request = UNNotificationRequest(identifier: timer.id.uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error.localizedDescription)")
            }
        }
    }
}
