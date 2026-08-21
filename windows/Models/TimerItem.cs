using System;

namespace MultiTimer.Models;

public class TimerItem
{
    public string Name { get; set; } = "New Timer";
    public string Notes { get; set; } = string.Empty;
    public TimeSpan InitialDuration { get; set; } = TimeSpan.Zero;
    public TimeSpan RemainingTime { get; set; } = TimeSpan.Zero;
    public int DurationSeconds
    {
        get => (int)InitialDuration.TotalSeconds;
        set => InitialDuration = TimeSpan.FromSeconds(value);
    }
}
