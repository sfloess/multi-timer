using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MultiTimer.Models;
using MultiTimer.Services;

namespace MultiTimer.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly ITimerRepository _repository;

    [ObservableProperty]
    private ObservableCollection<TimerViewModel> _timers;

    public MainViewModel(List<TimerItem> initialTimers)
    {
        _repository = new TimerRepository();
        Timers = new ObservableCollection<TimerViewModel>();

        foreach (var item in initialTimers)
        {
            Timers.Add(new TimerViewModel(item));
        }
    }

    [RelayCommand]
    private void AddTimer()
    {
        Timers.Add(new TimerViewModel(new TimerItem()));
        SaveState();
    }

    [RelayCommand]
    private void DeleteSelected()
    {
        var selected = Timers.Where(t => t.IsSelected).ToList();
        foreach (var timer in selected)
        {
            Timers.Remove(timer);
        }
        SaveState();
    }

    [RelayCommand]
    private void MoveUp()
    {
        var timer = Timers.FirstOrDefault(t => t.IsSelected);
        if (timer == null) return;
        int index = Timers.IndexOf(timer);
        if (index > 0)
        {
            Timers.Move(index, index - 1);
            SaveState();
        }
    }

    [RelayCommand]
    private void MoveDown()
    {
        var timer = Timers.FirstOrDefault(t => t.IsSelected);
        if (timer == null) return;
        int index = Timers.IndexOf(timer);
        if (index < Timers.Count - 1 && index != -1)
        {
            Timers.Move(index, index + 1);
            SaveState();
        }
    }

    [RelayCommand]
    private void ClearAll()
    {
        Timers.Clear();
        SaveState();
    }

    private void SaveState()
    {
        var items = Timers.Select(t => t.TimerItem).ToList();
        _repository.SaveTimers(items);
    }
}
