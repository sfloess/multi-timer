import Foundation
import SwiftUI
import SwiftData

class PersistenceService {
    static let shared = PersistenceService()
    
    private let container = Container(name: "MultiTimerContainer", type: .file)
    
    private init() {}
    
    func saveTimers(_ timers: [TimerModel]) {
        container.save(timers)
    }
    
    func loadTimers() -> [TimerModel] {
        container.load()
    }
}

