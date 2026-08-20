using System;
using System.IO;
using System.Media;
using System.Windows.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MultiTimer.Models;

namespace MultiTimer.ViewModels;

public partial class TimerViewModel : ObservableObject
{
    private readonly DispatcherTimer _timer;
    private DateTime _targetEndTime;
    private SoundPlayer? _soundPlayer;
    private readonly TimerItem _timerItem;

    [ObservableProperty]
    private bool _isSelected;

    [ObservableProperty]
    private bool _isRunning;

    [ObservableProperty]
    private bool _isAlerting;

    [ObservableProperty]
    private bool _isEditingNotes;

    [ObservableProperty]
    private int _hours;

    [ObservableProperty]
    private int _minutes;

    [ObservableProperty]
    private int _seconds;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(DisplayTime))]
    private TimeSpan _remainingTime;

    [ObservableProperty]
    private TimeSpan _initialDuration;

    [ObservableProperty]
    private string _name = "New Timer";

    [ObservableProperty]
    private string _notes = string.Empty;

    public TimerItem TimerItem
    {
        get
        {
            _timerItem.Name = Name;
            _timerItem.Notes = Notes;
            _timerItem.InitialDuration = InitialDuration;
            _timerItem.RemainingTime = RemainingTime;
            return _timerItem;
        }
    }

    public string DisplayTime
    {
        get
        {
            int totalHours = Math.Max(0, (int)RemainingTime.TotalHours);
            int mins = Math.Max(0, RemainingTime.Minutes);
            int secs = Math.Max(0, RemainingTime.Seconds);
            return $"{totalHours:D2}:{mins:D2}:{secs:D2}";
        }
    }

    public TimerViewModel() : this(new TimerItem())
    {
    }

    public TimerViewModel(TimerItem item)
    {
        _timerItem = item ?? new TimerItem();
        _name = string.IsNullOrWhiteSpace(_timerItem.Name) ? "New Timer" : _timerItem.Name;
        _notes = _timerItem.Notes ?? string.Empty;
        _initialDuration = _timerItem.InitialDuration;
        _remainingTime = _timerItem.RemainingTime;

        if (_initialDuration == TimeSpan.Zero && _remainingTime > TimeSpan.Zero)
        {
            _initialDuration = _remainingTime;
        }

        _hours = Math.Max(0, (int)_initialDuration.TotalHours);
        _minutes = Math.Clamp(_initialDuration.Minutes, 0, 59);
        _seconds = Math.Clamp(_initialDuration.Seconds, 0, 59);

        _timer = new DispatcherTimer
        {
            Interval = TimeSpan.FromMilliseconds(200)
        };
        _timer.Tick += Timer_Tick;
    }

    partial void OnNameChanged(string value)
    {
        _timerItem.Name = value;
    }

    partial void OnNotesChanged(string value)
    {
        _timerItem.Notes = value;
    }

    partial void OnRemainingTimeChanged(TimeSpan value)
    {
        _timerItem.RemainingTime = value;
    }

    partial void OnInitialDurationChanged(TimeSpan value)
    {
        _timerItem.InitialDuration = value;
    }

    partial void OnHoursChanged(int value) => UpdateDurationFromInput();
    partial void OnMinutesChanged(int value) => UpdateDurationFromInput();
    partial void OnSecondsChanged(int value) => UpdateDurationFromInput();

    private void UpdateDurationFromInput()
    {
        if (IsRunning) return;

        int h = Math.Max(0, Hours);
        int m = Math.Clamp(Minutes, 0, 59);
        int s = Math.Clamp(Seconds, 0, 59);

        TimeSpan newDuration = new TimeSpan(h, m, s);
        InitialDuration = newDuration;
        RemainingTime = newDuration;
    }

    [RelayCommand]
    public void Start()
    {
        if (IsRunning) return;

        if (RemainingTime <= TimeSpan.Zero)
        {
            if (InitialDuration > TimeSpan.Zero)
            {
                RemainingTime = InitialDuration;
            }
            else
            {
                return;
            }
        }

        DismissAlert();
        _targetEndTime = DateTime.Now + RemainingTime;
        IsRunning = true;
        _timer.Start();
    }

    [RelayCommand]
    public void Pause()
    {
        if (IsRunning)
        {
            _timer.Stop();
            IsRunning = false;
        }
    }

    [RelayCommand]
    public void Reset()
    {
        _timer.Stop();
        IsRunning = false;
        DismissAlert();
        RemainingTime = InitialDuration;
    }

    [RelayCommand]
    public void ToggleNotes()
    {
        IsEditingNotes = !IsEditingNotes;
    }

    [RelayCommand]
    public void DismissAlert()
    {
        IsAlerting = false;
        StopSound();
    }

    private void Timer_Tick(object? sender, EventArgs e)
    {
        TimeSpan remaining = _targetEndTime - DateTime.Now;
        if (remaining <= TimeSpan.Zero)
        {
            _timer.Stop();
            RemainingTime = TimeSpan.Zero;
            IsRunning = false;
            IsAlerting = true;
            PlayAlertSound();
        }
        else
        {
            RemainingTime = remaining;
        }
    }

    private void PlayAlertSound()
    {
        try
        {
            string wavPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "Alarm.wav");
            if (File.Exists(wavPath))
            {
                _soundPlayer = new SoundPlayer(wavPath);
                _soundPlayer.PlayLooping();
            }
            else
            {
                SystemSounds.Exclamation.Play();
            }
        }
        catch
        {
            try
            {
                SystemSounds.Beep.Play();
            }
            catch
            {
            }
        }
    }

    private void StopSound()
    {
        try
        {
            _soundPlayer?.Stop();
            _soundPlayer?.Dispose();
            _soundPlayer = null;
        }
        catch
        {
        }
    }
}
