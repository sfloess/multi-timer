
using System;
using System.IO;
using System.Linq;
using System.Windows;
using MultiTimer.Models;
using MultiTimer.Services;
using MultiTimer.ViewModels;

namespace MultiTimer;

public partial class App : Application
{
    private ITimerRepository _timerRepository;
    private MainViewModel _mainViewModel;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        try
        {
            _timerRepository = new TimerRepository();
            var savedTimers = _timerRepository.LoadTimers();
            _mainViewModel = new MainViewModel(savedTimers);

            if (Current.MainWindow is MainWindow mainWindow)
            {
                mainWindow.DataContext = _mainViewModel;
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Failed to load timer data: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            _mainViewModel = new MainViewModel(new List<TimerItem>());
            if (Current.MainWindow is MainWindow mainWindow)
            {
                mainWindow.DataContext = _mainViewModel;
            }
        }
    }

    protected override void OnExit(ExitEventArgs e)
    {
        try
        {
            if (_mainViewModel != null && _timerRepository != null)
            {
                var timerItems = _mainViewModel.Timers
                    .Select(timer => timer.TimerItem)
                    .ToList();
                _timerRepository.SaveTimers(timerItems);
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Failed to save timer data: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Warning);
        }

        base.OnExit(e);
    }
}
