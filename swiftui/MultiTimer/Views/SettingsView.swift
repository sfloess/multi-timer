import SwiftUI

struct SettingsView: View {
    @ObservedObject var configManager: ConfigManager
    @State private var storageMode: StorageMode
    @State private var sqlitePath: String
    @State private var pgHost: String
    @State private var pgPort: String
    @State private var pgDatabase: String
    @State private var pgUsername: String
    @State private var pgPassword: String
    @State private var testConnectionResult: String? = nil
    @State private var isTestingConnection = false

    init(configManager: ConfigManager) {
        self.configManager = configManager
        _storageMode = State(initialValue: configManager.config.storageMode)
        _sqlitePath = State(initialValue: configManager.config.sqlitePath)
        _pgHost = State(initialValue: configManager.config.postgres.host)
        _pgPort = State(initialValue: String(configManager.config.postgres.port))
        _pgDatabase = State(initialValue: configManager.config.postgres.database)
        _pgUsername = State(initialValue: configManager.config.postgres.username)
        _pgPassword = State(initialValue: configManager.config.postgres.password)
    }

    var body: some View {
        Form {
            Section(header: Text("Storage Engine")) {
                Picker("Storage Mode", selection: $storageMode) {
                    Text("JSON (Legacy)").tag(StorageMode.json)
                    Text("SQLite").tag(StorageMode.sqlite)
                    Text("PostgreSQL").tag(StorageMode.postgres)
                }
                .pickerStyle(.segmented)
            }

            if storageMode == .sqlite {
                Section(header: Text("SQLite Configuration")) {
                    TextField("SQLite Path", text: $sqlitePath)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                }
            }

            if storageMode == .postgres {
                Section(header: Text("PostgreSQL Configuration")) {
                    TextField("Host", text: $pgHost)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    TextField("Port", text: $pgPort)
                        .keyboardType(.numberPad)
                    TextField("Database", text: $pgDatabase)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    TextField("Username", text: $pgUsername)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    SecureField("Password", text: $pgPassword)

                    Button(action: testConnection) {
                        HStack {
                            Text("Test Connection")
                            if isTestingConnection {
                                Spacer()
                                ProgressView()
                            }
                        }
                    }

                    if let result = testConnectionResult {
                        Text(result)
                            .font(.footnote)
                            .foregroundColor(result.contains("Success") ? .green : .red)
                    }
                }
            }

            Section {
                Button("Save Changes") {
                    saveSettings()
                }
                .fontWeight(.bold)
            }
        }
        .navigationTitle("Settings")
    }

    private func saveSettings() {
        configManager.config.storageMode = storageMode
        configManager.config.sqlitePath = sqlitePath
        configManager.config.postgres.host = pgHost
        configManager.config.postgres.port = Int(pgPort) ?? 5432
        configManager.config.postgres.database = pgDatabase
        configManager.config.postgres.username = pgUsername
        configManager.config.postgres.password = pgPassword
        configManager.saveConfig()

        let _ = DatabaseService.shared.setStorageMode(storageMode)
    }

    private func testConnection() {
        isTestingConnection = true
        testConnectionResult = nil

        // Temporarily apply configuration for testing
        configManager.config.postgres.host = pgHost
        configManager.config.postgres.port = Int(pgPort) ?? 5432
        configManager.config.postgres.database = pgDatabase
        configManager.config.postgres.username = pgUsername
        configManager.config.postgres.password = pgPassword

        DispatchQueue.global().async {
            let success = DatabaseService.shared.testPostgresConnection()
            DispatchQueue.main.async {
                isTestingConnection = false
                testConnectionResult = success ? "Connection Successful!" : "Connection Failed."
            }
        }
    }
}
