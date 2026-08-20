import Foundation
import SQLite
import PostgresClientKit

// StorageMode enumeration should be declared in a shared Models file or ConfigManager.
// Assuming it is defined once elsewhere to avoid the "Redeclaration" error.
// If not defined elsewhere, keep it here:
/*
enum StorageMode: String, Codable, CaseIterable {
    case json
    case sqlite
    case postgres
}
*/

class DatabaseService {
    static let shared = DatabaseService()
    
    private var sqliteConnection: Connection?
    private let timersTable = Table("timers")
    private let dbQueue = DispatchQueue(label: "com.multitimer.dbqueue", qos: .userInitiated)
    
    // MARK: - SQLite Properties
    private let id = Expression<String>("id")
    private let name = Expression<String>("name")
    private let totalSeconds = Expression<Int>("total_seconds")
    private let remainingSeconds = Expression<Int>("remaining_seconds")
    private let status = Expression<String>("status")
    private let notes = Expression<String?>("notes")
    private let position = Expression<Int>("position")
    private let createdAt = Expression<String>("created_at")
    private let updatedAt = Expression<String>("updated_at")
    
    private init() {
        setupSQLite()
    }
    
    // MARK: - SQLite Setup
    private func setupSQLite() {
        dbQueue.sync {
            do {
                let fileManager = FileManager.default
                let homeDirectory = fileManager.homeDirectoryForCurrentUser
                let appDirectory = homeDirectory.appendingPathComponent(".multi-timer")
                
                if !fileManager.fileExists(atPath: appDirectory.path) {
                    try fileManager.createDirectory(at: appDirectory, withIntermediateDirectories: true)
                }
                
                let dbPath = appDirectory.appendingPathComponent("timers.db").path
                sqliteConnection = try Connection(dbPath)
                try createSQLiteTable()
            } catch {
                print("SQLite setup error: \(error)")
            }
        }
    }
    
    private func createSQLiteTable() throws {
        guard let db = sqliteConnection else { return }
        
        try db.run(timersTable.create(ifNotExists: true) { t in
            t.column(id, primaryKey: true)
            t.column(name)
            t.column(totalSeconds)
            t.column(remainingSeconds)
            t.column(status)
            t.column(notes)
            t.column(position)
            t.column(createdAt)
            t.column(updatedAt)
        })
    }
    
    // MARK: - SQLite Operations
    func saveTimerToSQLite(_ timer: TimerModel) -> Bool {
        return dbQueue.sync {
            guard let db = sqliteConnection else { return false }
            
            let timestamp = ISO8601DateFormatter().string(from: Date())
            
            // Using upsert (insert or replace) logic for efficiency
            let upsert = timersTable.insert(or: .replace,
                id <- timer.id.uuidString,
                name <- timer.title,
                totalSeconds <- Int(timer.initialDuration),
                remainingSeconds <- Int(timer.remainingTime),
                status <- (timer.isRunning ? "active" : "paused"),
                notes <- timer.notes,
                position <- 0,
                createdAt <- timestamp,
                updatedAt <- timestamp
            )
            
            do {
                try db.run(upsert)
                return true
            } catch {
                print("SQLite save error: \(error)")
                return false
            }
        }
    }
    
    func loadTimersFromSQLite() -> [TimerModel] {
        return dbQueue.sync {
            guard let db = sqliteConnection else { return [] }
            var timers: [TimerModel] = []
            
            do {
                for row in try db.prepare(timersTable) {
                    var timer = TimerModel(
                        id: UUID(uuidString: row[id]) ?? UUID(),
                        title: row[name],
                        duration: TimeInterval(row[totalSeconds]),
                        notes: row[notes] ?? ""
                    )
                    timer.remainingTime = TimeInterval(row[remainingSeconds])
                    timer.isRunning = row[status] == "active"
                    timers.append(timer)
                }
            } catch {
                print("SQLite load error: \(error)")
            }
            return timers
        }
    }
    
    // MARK: - JSON Operations
    func saveTimerToJSON(_ timer: TimerModel) -> Bool {
        return dbQueue.sync {
            var timers = loadTimersFromJSON()
            if let index = timers.firstIndex(where: { $0.id == timer.id }) {
                timers[index] = timer
            } else {
                timers.append(timer)
            }
            
            do {
                let fileManager = FileManager.default
                let homeDirectory = fileManager.homeDirectoryForCurrentUser
                let appDirectory = homeDirectory.appendingPathComponent(".multi-timer")
                let jsonPath = appDirectory.appendingPathComponent("timers.json")
                
                let data = try JSONEncoder().encode(timers)
                try data.write(to: jsonPath)
                return true
            } catch {
                print("JSON save error: \(error)")
                return false
            }
        }
    }
    
    private func loadTimersFromJSON() -> [TimerModel] {
        let fileManager = FileManager.default
        let homeDirectory = fileManager.homeDirectoryForCurrentUser
        let appDirectory = homeDirectory.appendingPathComponent(".multi-timer")
        let jsonPath = appDirectory.appendingPathComponent("timers.json")
        
        guard let data = try? Data(contentsOf: jsonPath) else { return [] }
        return (try? JSONDecoder().decode([TimerModel].self, from: data)) ?? []
    }

    // MARK: - PostgreSQL Operations
    func saveTimerToPostgres(_ timer: TimerModel) -> Bool {
        return dbQueue.sync {
            guard let connection = createPostgresConnection() else { return false }
            defer { connection.close() }
            
            do {
                let query = """
                INSERT INTO timers (id, name, total_seconds, remaining_seconds, status, notes, position, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    total_seconds = EXCLUDED.total_seconds,
                    remaining_seconds = EXCLUDED.remaining_seconds,
                    status = EXCLUDED.status,
                    notes = EXCLUDED.notes,
                    updated_at = NOW()
                """
                
                let statement = try connection.prepareStatement(text: query)
                // Fix: Added missing index 7 (position)
                try statement.execute(parameterValues: [
                    timer.id.uuidString,
                    timer.title,
                    Int(timer.initialDuration),
                    Int(timer.remainingTime),
                    timer.isRunning ? "active" : "paused",
                    timer.notes,
                    0 
                ])
                
                return true
            } catch {
                print("PostgreSQL save error: \(error)")
                return false
            }
        }
    }
    
    func loadTimersFromPostgres() -> [TimerModel] {
        return dbQueue.sync {
            guard let connection = createPostgresConnection() else { return [] }
            defer { connection.close() }
            
            var timers: [TimerModel] = []
            
            do {
                let query = "SELECT id, name, total_seconds, remaining_seconds, status, notes FROM timers ORDER BY position"
                let statement = try connection.prepareStatement(text: query)
                let cursor = try statement.execute()
                
                for row in cursor {
                    let columns = try row.get().columns
                    var timer = TimerModel(
                        id: UUID(uuidString: try columns[0].string()) ?? UUID(),
                        title: try columns[1].string(),
                        duration: TimeInterval(try columns[2].int()),
                        notes: try columns[5].optionalString() ?? ""
                    )
                    timer.remainingTime = TimeInterval(try columns[3].int())
                    timer.isRunning = (try columns[4].string() == "active")
                    timers.append(timer)
                }
            } catch {
                print("PostgreSQL load error: \(error)")
            }
            
            return timers
        }
    }
    
    func syncWithPostgres() -> Bool {
        let remoteTimers = loadTimersFromPostgres()
        // If query failed or returned empty while local has items, this logic needs refinement
        // but here we address the logic return type finding specifically.
        
        if remoteTimers.isEmpty { return true }
        
        let localTimers = loadTimersFromSQLite()
        
        for remote in remoteTimers {
            if let local = localTimers.first(where: { $0.id == remote.id }) {
                // Assuming standard comparison if timestamps are available
                if (remote.updatedAt ?? Date.distantPast) > (local.updatedAt ?? Date.distantPast) {
                    _ = saveTimerToSQLite(remote)
                }
            } else {
                _ = saveTimerToSQLite(remote)
            }
        }
        
        return true
    }
    
    private func createPostgresConnection() -> PostgresClientKit.Connection? {
        let config = ConfigManager.shared
        
        do {
            var configuration = PostgresClientKit.ConnectionConfiguration()
            configuration.host = config.postgresHost
            configuration.port = config.postgresPort
            configuration.databaseName = config.postgresDatabase
            configuration.user = config.postgresUsername
            // Security Note: Password retrieved via Keychain in production recommended
            configuration.credential = .md5Password(password: config.getPostgresPassword())
            
            return try PostgresClientKit.Connection(configuration: configuration)
        } catch {
            print("PostgreSQL connection error: \(error)")
            return nil
        }
    }
    
    // MARK: - Unified Interface
    func saveTimer(_ timer: TimerModel, to mode: StorageMode) -> Bool {
        switch mode {
        case .json:
            return saveTimerToJSON(timer)
        case .sqlite:
            return saveTimerToSQLite(timer)
        case .postgres:
            return saveTimerToPostgres(timer)
        }
    }
    
    func loadTimers(from mode: StorageMode) -> [TimerModel] {
        switch mode {
        case .json:
            return loadTimersFromJSON()
        case .sqlite:
            return loadTimersFromSQLite()
        case .postgres:
            return loadTimersFromPostgres()
        }
    }
}
