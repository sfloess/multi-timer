using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using CommunityToolkit.Mvvm.Input;
using MultiTimer.Services;

namespace MultiTimer.ViewModels;

public class SettingsViewModel : INotifyPropertyChanged
{
    private readonly ConfigService _configService;

    public SettingsViewModel()
    {
        _configService = ConfigService.Instance;
        LoadConfig();
        SaveCommand = new RelayCommand(Save);
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    private AppConfig _config = new();
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

    private void LoadConfig()
    {
        Config = _configService.GetConfig();
    }

    private void Save()
    {
        _configService.SaveConfig(Config);
    }
}
