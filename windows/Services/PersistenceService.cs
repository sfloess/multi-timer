using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using MultiTimer.Models;

namespace MultiTimer.Services;

public interface ITimerRepository
{
    List<TimerItem> LoadTimers();
    void SaveTimers(List<TimerItem> timers);
}

public class TimerRepository : ITimerRepository
{
    private readonly string _filePath;
    private readonly JsonSerializerOptions _jsonOptions;

    public TimerRepository()
    {
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "MultiTimer");
        Directory.CreateDirectory(dir);
        _filePath = Path.Combine(dir, "timers.json");
        _jsonOptions = new JsonSerializerOptions { WriteIndented = true };
    }

    public List<TimerItem> LoadTimers()
    {
        if (!File.Exists(_filePath))
            return new List<TimerItem>();

        try
        {
            var json = File.ReadAllText(_filePath);
            return JsonSerializer.Deserialize<List<TimerItem>>(json, _jsonOptions)
                ?? new List<TimerItem>();
        }
        catch
        {
            return new List<TimerItem>();
        }
    }

    public void SaveTimers(List<TimerItem> timers)
    {
        try
        {
            var json = JsonSerializer.Serialize(timers, _jsonOptions);
            File.WriteAllText(_filePath, json);
        }
        catch
        {
        }
    }
}
