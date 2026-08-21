package com.flossware.multitimer.service;

import com.flossware.multitimer.AppState;
import com.flossware.multitimer.model.TimerModel;
import java.beans.PropertyChangeSupport;
import java.util.Timer;
import java.util.TimerTask;
import javax.swing.SwingUtilities;

public class TimerService {
    private final AppState state;
    private final SoundService soundService;
    private final Timer timer;
    private final PropertyChangeSupport pcs;

    public TimerService(AppState state, SoundService soundService) {
        this.state = state;
        this.soundService = soundService;
        this.timer = new Timer(true);
        this.pcs = new PropertyChangeSupport(this);
    }

    public void start() {
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                SwingUtilities.invokeLater(() -> {
                    for (TimerModel model : state.getTimers()) {
                        if (model.isRunning()) {
                            model.decrement();
                            if (model.isFinished()) {
                                soundService.playAlarm();
                            }
                        }
                    }
                });
            }
        }, 1000, 1000);
    }

    public void stop() {
        timer.cancel();
    }

    public PropertyChangeSupport getPcs() {
        return pcs;
    }
}
