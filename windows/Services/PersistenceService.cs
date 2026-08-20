

using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using MultiTimer.Models;

public class PersistenceService : ITimerRepository
{
    private string _filePath;

    public PersistenceService()
    {
        _filePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "MultiTimer", "timers.json");
        Directory.CreateDirectory(Path.GetDirectoryName(_filePath) ?? string.Empty);
    }

    public List<TimerItem> LoadTimers()
    {
        if (!File.Exists(_filePath))
            return new List<TimerItem>();

        try
        {
            var json = File.ReadAllText(_filePath);
            return JsonSerializer.Deserialize<List<TimerItem>>(json);
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
            var options = new JsonSerializerOptions { WriteIndented = true };
            var json = JsonSerializer.Serialize(timers, options);
            File.WriteAllText(_filePath, json);
        }
        catch
        {
            // Handle exception
        }
    }
}

