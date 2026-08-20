using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using CommunityToolkit.Mvvm.Input;
using MultiTimer.Services;

namespace MultiTimer.ViewModels;

public class SettingsViewModel : INotifyPropertyChanged
{
    private readonly ConfigService _configService;
    private readonly DatabaseService _databaseService;

    public SettingsViewModel(ConfigService configService, DatabaseService databaseService)
    {
        _configService = configService;
        _databaseService = databaseService;
        LoadConfig();

        SaveCommand = new RelayCommand(Save);
        TestConnectionCommand = new RelayCommand(TestConnection);
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    private AppConfig _config;
    public AppConfig Config
    {
        get => _config;
        set
        {
            if (_config != value)
            {
                _config = value;
                OnPropertyChanged();
            }
        }
    }

    public ICommand SaveCommand { get; }
    public ICommand TestConnectionCommand { get; }

    private void LoadConfig()
    {
        Config = _configService.Load();
    }

    private void Save()
    {
        _configService.Save(Config);
    }

    private void TestConnection()
    {
        if (Config.StorageMode == StorageMode.PostgreSql)
        {
            var success = _databaseService.TestPostgreSqlConnection(
                Config.PostgresHost,
                Config.PostgresPort,
                Config.PostgresDatabase,
                Config.PostgresUser,
                Config.PostgresPassword
            );
            // TODO: Show success/failure message in UI
        }
    }
}
