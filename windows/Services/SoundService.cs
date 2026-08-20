using System;
using System.IO;
using System.Media;

namespace MultiTimer.Services;

public interface ISoundService
{
    void PlayAlarm();
    void StopAlarm();
}

public class SoundService : ISoundService
{
    private SoundPlayer? _soundPlayer;

    public SoundService()
    {
        InitializeSoundPlayer();
    }

    private void InitializeSoundPlayer()
    {
        try
        {
            string soundPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "Alarm.wav");
            if (File.Exists(soundPath))
            {
                _soundPlayer = new SoundPlayer(soundPath);
                _soundPlayer.LoadAsync();
            }
            else
            {
                _soundPlayer = null;
            }
        }
        catch
        {
            _soundPlayer = null;
        }
    }

    public void PlayAlarm()
    {
        try
        {
            if (_soundPlayer != null)
            {
                _soundPlayer.Play();
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
                // Ignore error if audio system fails
            }
        }
    }

    public void StopAlarm()
    {
        try
        {
            _soundPlayer?.Stop();
        }
        catch
        {
            // Ignore error
        }
    }
}
