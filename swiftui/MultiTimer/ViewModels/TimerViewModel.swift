import Foundation
import SwiftUI
import UserNotifications
import AVFoundation

/// Typealias for TimerViewModel to maintain flexibility across the codebase
typealias TimerViewModel = TimerManager

@Observable
final class TimerManager {
    // MARK: - Published Properties
    var timers: [TimerModel] = []
    
    // MARK: - Private Properties
    private var tickerTimer: Timer?
    private var audioPlayer: AVAudioPlayer?
    private let storageKey = "MultiTimer_SavedTimers"
    
    // MARK: - Initialization
    init() {
        loadTimers()
        startTicker()
    }
    
    deinit {
        tickerTimer?.invalidate()
    }
    
    // MARK: - Timer Control Actions
    
    func addTimer(
        title: String = "New Timer",
        duration: TimeInterval = 300,
        notes: String = ""
    ) {
        let newTimer = TimerModel(
            title: title,
            duration: duration,
            notes: notes
        )
        timers.append(newTimer)
        saveTimers()
    }
    
    func startTimer(id: UUID) {
        guard let index = timers.firstIndex(where: { $0.id == id }) else { return }
        guard timers[index].remainingTime > 0 else { return }
        
        timers[index].isRunning = true
        timers[index].lastUpdated = Date()
        scheduleNotification(for: timers[index])
        saveTimers()
    }
    
    func pauseTimer(id: UUID) {
        guard let index = timers.firstIndex(where: { $0.id == id }) else { return }
        
        timers[index].isRunning = false
        timers[index].lastUpdated = nil
        cancelNotification(for: timers[index])
        saveTimers()
    }
    
    func resetTimer(id: UUID) {
        guard let index = timers.firstIndex(where: { $0.id == id }) else { return }
        
        timers[index].isRunning = false
        timers[index].remainingTime = timers[index].initialDuration
        timers[index].lastUpdated = nil
        cancelNotification(for: timers[index])
        saveTimers()
    }
    
    func updateTimer(
        id: UUID,
        title: String? = nil,
        duration: TimeInterval? = nil,
        notes: String? = nil
    ) {
        guard let index = timers.firstIndex(where: { $0.id == id }) else { return }
        
        if let title = title {
            timers[index].title = title
        }
        if let notes = notes {
            timers[index].notes = notes
        }
        if let duration = duration {
            timers[index].initialDuration = duration
            if !timers[index].isRunning {
                timers[index].remainingTime = duration
            }
        }
        saveTimers()
    }
    
    func setDuration(id: UUID, hours: Int, minutes: Int, seconds: Int) {
        let totalSeconds = TimeInterval(hours * 3600 + minutes * 60 + seconds)
        guard let index = timers.firstIndex(where: { $0.id == id }) else { return }
        
        cancelNotification(for: timers[index])
        timers[index].isRunning = false
        timers[index].initialDuration = totalSeconds
        timers[index].remainingTime = totalSeconds
        timers[index].lastUpdated = nil
        saveTimers()
    }
    
    func deleteTimer(id: UUID) {
        if let timer = timers.firstWhere(id: id) {
            cancelNotification(for: timer)
        }
        timers.removeAll { $0.id == id }
        saveTimers()
    }
    
    func deleteTimers(at offsets: IndexSet) {
        for index in offsets {
            if index < timers.count {
                cancelNotification(for: timers[index])
            }
        }
        timers.remove(atOffsets: offsets)
        saveTimers()
    }
    
    func moveTimers(from source: IndexSet, to destination: Int) {
        timers.move(fromOffsets: source, toOffset: destination)
        saveTimers()
    }
    
    func clearAll() {
        for timer in timers {
            cancelNotification(for: timer)
        }
        timers.removeAll()
        saveTimers()
    }
    
    // MARK: - Timer Engine (Ticker)
    
    private func startTicker() {
        tickerTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.tick()
        }
    }
    
    private func tick() {
        let now = Date()
        var stateChanged = false
        
        for i in 0..<timers.count {
            guard timers[i].isRunning else { continue }
            
            if let lastUpdated = timers[i].lastUpdated {
                let elapsed = now.timeIntervalSince(lastUpdated)
                timers[i].lastUpdated = now
                
                if timers[i].remainingTime > elapsed {
                    timers[i].remainingTime -= elapsed
                } else {
                    timers[i].remainingTime = 0
                    timers[i].isRunning = false
                    timers[i].lastUpdated = nil
                    timerDidFinish(timers[i])
                    stateChanged = true
                }
            } else {
                timers[i].lastUpdated = now
            }
        }
        
        if stateChanged {
            saveTimers()
        }
    }
    
    private func timerDidFinish(_ timer: TimerModel) {
        playAlarmSound()
        triggerHapticFeedback()
    }
    
    // MARK: - Notifications & Sound
    
    private func scheduleNotification(for timer: TimerModel) {
        guard timer.remainingTime > 0 else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Timer Finished!"
        content.body = "\(timer.title) has reached zero."
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: timer.remainingTime, repeats: false)
        let request = UNNotificationRequest(identifier: timer.id.uuidString, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Notification scheduling error: \(error.localizedDescription)")
            }
        }
    }
    
    private func cancelNotification(for timer: TimerModel) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [timer.id.uuidString])
    }
    
    private func playAlarmSound() {
        // Play system alert sound
        AudioServicesPlaySystemSound(1005)
        
        // Attempt audio playback if custom sound file exists
        if let soundURL = Bundle.main.url(forResource: "alarm", withExtension: "mp3") {
            do {
                audioPlayer = try AVAudioPlayer(contentsOf: soundURL)
                audioPlayer?.play()
            } catch {
                print("Audio player error: \(error.localizedDescription)")
            }
        }
    }
    
    private func triggerHapticFeedback() {
        #if os(iOS)
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
        #endif
    }
    
    // MARK: - Persistence (UserDefaults + Codable)
    
    private func saveTimers() {
        do {
            let data = try JSONEncoder().encode(timers)
            UserDefaults.standard.set(data, forKey: storageKey)
        } catch {
            print("Failed to encode timers: \(error.localizedDescription)")
        }
    }
    
    private func loadTimers() {
        guard let data = UserDefaults.standard.data(forKey: storageKey) else {
            // Default initial state if app is launched for the first time
            self.timers = [
                TimerModel(title: "Quick Timer", duration: 300, notes: "5 minute focus session"),
                TimerModel(title: "Tea Timer", duration: 180, notes: "Steep green tea")
            ]
            return
        }
        
        do {
            var loadedTimers = try JSONDecoder().decode([TimerModel].self, from: data)
            let now = Date()
            
            // Adjust running timers for time spent while app was suspended
            for i in 0..<loadedTimers.count {
                if loadedTimers[i].isRunning, let lastUpdated = loadedTimers[i].lastUpdated {
                    let elapsed = now.timeIntervalSince(lastUpdated)
                    if loadedTimers[i].remainingTime > elapsed {
                        loadedTimers[i].remainingTime -= elapsed
                        loadedTimers[i].lastUpdated = now
                    } else {
                        loadedTimers[i].remainingTime = 0
                        loadedTimers[i].isRunning = false
                        loadedTimers[i].lastUpdated = nil
                    }
                }
            }
            self.timers = loadedTimers
        } catch {
            print("Failed to decode saved timers: \(error.localizedDescription)")
            self.timers = []
        }
    }
}

// MARK: - Collection Helper
private extension Array where Element == TimerModel {
    func firstWhere(id: UUID) -> TimerModel? {
        first { $0.id == id }
    }
}
