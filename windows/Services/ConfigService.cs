using System;
using System.IO;
using System.Text.Json;

namespace MultiTimer.Services;

public class AppConfig
{
    private static readonly string DefaultAppDataFolder = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "multi-timer");

    public string StorageMode { get; set; } = "json";
    public string SqlitePath { get; set; } = Path.Combine(DefaultAppDataFolder, "timers.db");
    public string PgHost { get; set; } = "localhost";
    public int PgPort { get; set; } = 5432;
    public string PgDatabase { get; set; } = "multitimer";
    public string PgUser { get; set; } = "postgres";
    public string PgPassword { get; set; } = string.Empty;
}

public class ConfigService
{
    private static readonly Lazy<ConfigService> _instance = new(() => new ConfigService());
    public static ConfigService Instance => _instance.Value;

    private readonly string _configDirectory;
    private readonly string _configFilePath;
    private readonly JsonSerializerOptions _jsonOptions;
    private AppConfig? _cachedConfig;
    private readonly object _lock = new();

    public ConfigService()
    {
        _configDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "multi-timer");

        _configFilePath = Path.Combine(_configDirectory, "config.json");

        _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNameCaseInsensitive = true
        };
    }

    public AppConfig GetConfig()
    {
        lock (_lock)
        {
            if (_cachedConfig != null)
            {
                return _cachedConfig;
            }

            try
            {
                if (File.Exists(_configFilePath))
                {
                    string json = File.ReadAllText(_configFilePath);
                    _cachedConfig = JsonSerializer.Deserialize<AppConfig>(json, _jsonOptions);
                }
            }
            catch
            {
                // Fall back to default configuration on read/deserialization failure
                _cachedConfig = null;
            }

            if (_cachedConfig == null)
            {
                _cachedConfig = new AppConfig();
                SaveConfig(_cachedConfig);
            }

            return _cachedConfig;
        }
    }

    public void SaveConfig(AppConfig? config = null)
    {
        lock (_lock)
        {
            if (config != null)
            {
                _cachedConfig = config;
            }

            _cachedConfig ??= new AppConfig();

            try
            {
                if (!Directory.Exists(_configDirectory))
                {
                    Directory.CreateDirectory(_configDirectory);
                }

                string json = JsonSerializer.Serialize(_cachedConfig, _jsonOptions);
                File.WriteAllText(_configFilePath, json);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to save configuration to '{_configFilePath}'.", ex);
            }
        }
    }
}
