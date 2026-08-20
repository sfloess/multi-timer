using System;
using CommunityToolkit.Mvvm.ComponentModel;

namespace MultiTimer.Models;

public partial class TimerModel : ObservableObject
{
    [ObservableProperty] private Guid _id = Guid.NewGuid();

    [ObservableProperty] private string _name = string.Empty;

    [ObservableProperty] private TimeSpan _duration = TimeSpan.Zero;

    [ObservableProperty] private bool _isRunning = false;

    [ObservableProperty] private string _notes = string.Empty;

    public TimeSpan Remaining => IsRunning
        ? Duration - (DateTime.Now - StartTime)
        : Duration;

    public DateTime? StartTime { get; private set; }

    public void Start() => StartTime = DateTime.Now;

    public void Stop() => IsRunning = false;

    public void Reset()
    {
        IsRunning = false;
        StartTime = null;
    }

    public void SetDuration(TimeSpan newDuration)
    {
        Duration = newDuration;
        StartTime = null;
    }
}
