import Foundation

/// Represents the available storage engines for the application.
enum StorageMode: String, Codable, CaseIterable {
    case json
    case sqlite
    case postgres
}

/// Configuration for remote PostgreSQL synchronization.
struct PostgresConfig: Codable {
    var host: String = "localhost"
    var port: Int = 5432
    var database: String = "multitimer"
    var username: String = "user"
    var password: String = ""
}

/// The root configuration structure for the application.
struct AppConfig: Codable {
    var storageMode: StorageMode = .sqlite
    var sqlitePath: String = "~/.multi-timer/timers.db"
    var postgres: PostgresConfig = PostgresConfig()
    var lastSyncTimestamp: Date?
}

/// Manages application configuration, persisting to a JSON file in the user's home directory.
@Observable
final class ConfigManager {
    static let shared = ConfigManager()

    var config: AppConfig {
        didSet {
            save()
        }
    }

    private let configURL: URL
    private let directoryURL: URL

    init() {
        // Define the path: ~/.multi-timer/config.json
        let home = FileManager.default.homeDirectoryForCurrentUser
        self.directoryURL = home.appendingPathComponent(".multi-timer")
        self.configURL = directoryURL.appendingPathComponent("config.json")

        // Ensure the directory exists
        do {
            try FileManager.default.createDirectory(at: directoryURL, withIntermediateDirectories: true)
        } catch {
            print("ConfigManager: Failed to create config directory: \(error)")
        }

        // Load existing configuration or use defaults
        if let data = try? Data(contentsOf: configURL),
           let decoded = try? JSONDecoder().decode(AppConfig.self, from: data) {
            self.config = decoded
        } else {
            self.config = AppConfig()
        }
    }

    /// Persists the current configuration to the JSON file.
    func save() {
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = .prettyPrinted
            let data = try encoder.encode(config)
            try data.write(to: configURL, options: .atomic)
        } catch {
            print("ConfigManager: Failed to save config: \(error)")
        }
    }

    /// Reloads configuration from the file.
    func load() {
        if let data = try? Data(contentsOf: configURL),
           let decoded = try? JSONDecoder().decode(AppConfig.self, from: data) {
            self.config = decoded
        }
    }

    /// Resolves a file path that may contain the tilde (~) shortcut.
    /// Useful for the SQLite path configuration.
    func resolvePath(_ path: String) -> URL {
        if path.hasPrefix("~") {
            let expanded = path.replacingOccurrences(of: "~", with: FileManager.default.homeDirectoryForCurrentUser.path)
            return URL(fileURLWithPath: expanded)
        }
        return URL(fileURLWithPath: path)
    }
    
    /// Resets configuration to factory defaults.
    func resetToDefaults() {
        self.config = AppConfig()
    }
}
