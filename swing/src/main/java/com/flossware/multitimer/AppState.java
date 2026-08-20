package com.flossware.multitimer;

import com.flossware.multitimer.model.TimerModel;
import java.util.ArrayList;
import java.util.List;

/**
 * AppState holds the list of timers to be persisted.
 * This class is designed to be safely serialized/deserialized via JSON.
 */
public class AppState {
    private List<TimerModel> timers = new ArrayList<>();

    public AppState() {
    }

    public List<TimerModel> getTimers() {
        return timers;
    }

    public void setTimers(List<TimerModel> timers) {
        this.timers = timers;
    }

    public void addTimer(TimerModel timer) {
        this.timers.add(timer);
    }
}
