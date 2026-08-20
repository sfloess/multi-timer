package com.flossware.multitimer.service;

import com.flossware.multitimer.AppState;
import com.flossware.multitimer.model.TimerModel;

import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class TimerService {

    private final AppState state;
    private final SoundService soundService;
    private final ScheduledExecutorService scheduler;
    private ScheduledFuture<?> scheduledFuture;

    public TimerService(AppState state, SoundService soundService) {
        this.state = state;
        this.soundService = soundService;
        this.scheduler = Executors.newSingleThreadScheduledExecutor();
    }

    public void start() {
        scheduledFuture = scheduler.scheduleAtFixedRate(this::tick, 0, 1, TimeUnit.SECONDS);
    }

    public void stop() {
        if (scheduledFuture != null && !scheduledFuture.isDone()) {
            scheduledFuture.cancel(true);
        }
        scheduler.shutdown();
    }

    private void tick() {
        List<TimerModel> timers = state.getTimers();
        for (TimerModel timer : timers) {
            if (timer.isRunning() && timer.getRemainingSeconds() > 0) {
                long newRemaining = timer.getRemainingSeconds() - 1;
                timer.setRemainingSeconds(newRemaining);
                timer.getPcs().firePropertyChange("remainingSeconds", timer.getRemainingSeconds() + 1, newRemaining);
                if (newRemaining == 0) {
                    timer.setStatus(TimerModel.Status.FINISHED);
                    timer.getPcs().firePropertyChange("status", timer.getStatus(), TimerModel.Status.FINISHED);
                    soundService.playAlarm(timer);
                }
            }
        }
    }
}
