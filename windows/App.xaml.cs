using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using MultiTimer.Models;
using MultiTimer.Services;
using MultiTimer.ViewModels;

namespace MultiTimer;

public partial class App : Application
{
    private ITimerRepository? _timerRepository;
    private MainViewModel? _mainViewModel;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        try
        {
            _timerRepository = new TimerRepository();
            var savedTimers = _timerRepository.LoadTimers();
            _mainViewModel = new MainViewModel(savedTimers);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Failed to load timers: {ex.Message}");
            _mainViewModel = new MainViewModel(new List<TimerItem>());
        }

        var mainWindow = new MainWindow();
        mainWindow.DataContext = _mainViewModel;
        mainWindow.Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        try
        {
            if (_mainViewModel != null && _timerRepository != null)
            {
                var items = _mainViewModel.Timers
                    .Select(t => t.TimerItem)
                    .ToList();
                _timerRepository.SaveTimers(items);
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Failed to save timers on exit: {ex.Message}");
        }

        base.OnExit(e);
    }
}
