package com.flossware.multitimer.service;

import com.flossware.multitimer.model.TimerModel;

import javax.sound.sampled.*;
import java.awt.Toolkit;
import java.io.IOException;
import java.net.URL;

/**
 * Service for playing alarm sounds when a timer reaches zero.
 * Uses javax.sound.sampled Clip to play a short WAV file.
 */
public class SoundService {

    private Clip alarmClip;

    /**
     * Loads a default alarm sound from the classpath.
     * The sound file should be placed in the resources directory (e.g., src/main/resources/alarm.wav).
     */
    public SoundService() {
        try {
            URL resource = getClass().getResource("/alarm.wav");
            if (resource == null) {
                // Fallback to system beep if no sound file is found
                return;
            }
            AudioInputStream inputStream = AudioSystem.getAudioInputStream(resource);
            alarmClip = AudioSystem.getClip();
            alarmClip.open(inputStream);
        } catch (UnsupportedAudioFileException | IOException | LineUnavailableException e) {
            // In case of error, fall back to system beep
            e.printStackTrace();
        }
    }

    /**
     * Plays the alarm sound.
     * If the clip is already playing, it restarts from the beginning.
     */
    public void playAlarm() {
        if (alarmClip == null) {
            Toolkit.getDefaultToolkit().beep();
            return;
        }
        if (alarmClip.isRunning()) {
            alarmClip.stop();
        }
        alarmClip.setFramePosition(0);
        alarmClip.start();
    }

    /**
     * Overloaded method to play alarm for a specific timer.
     */
    public void playAlarm(TimerModel timer) {
        playAlarm();
    }

    /**
     * Stops the alarm sound if it is currently playing.
     */
    public void stopAlarm() {
        if (alarmClip != null && alarmClip.isRunning()) {
            alarmClip.stop();
        }
    }

    /**
     * Sets a custom sound file to be used for alarms.
     *
     * @param url URL of the sound file (must be a supported audio format)
     * @throws IOException          if the file cannot be read
     * @throws UnsupportedAudioFileException if the audio format is not supported
     * @throws LineUnavailableException       if no audio line is available
     */
    public void setSoundFile(URL url) throws IOException, UnsupportedAudioFileException, LineUnavailableException {
        AudioInputStream inputStream = AudioSystem.getAudioInputStream(url);
        Clip clip = AudioSystem.getClip();
        clip.open(inputStream);
        this.alarmClip = clip;
    }

    /**
     * Releases resources used by the sound service.
     */
    public void close() {
        if (alarmClip != null && alarmClip.isRunning()) {
            alarmClip.stop();
        }
        if (alarmClip != null) {
            alarmClip.close();
        }
    }
}
