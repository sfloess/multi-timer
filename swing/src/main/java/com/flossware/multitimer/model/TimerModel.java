package com.flossware.multitimer.model;

import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeSupport;
import java.util.UUID;

public class TimerModel {
    private String id;
    private String name;
    private long totalSeconds;
    private long remainingSeconds;
    private Status status;
    private String notes;
    private transient PropertyChangeSupport pcs;

    public TimerModel(String name, long totalSeconds) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.totalSeconds = totalSeconds;
        this.remainingSeconds = totalSeconds;
        this.status = Status.IDLE;
        this.notes = "";
        this.pcs = new PropertyChangeSupport(this);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        String oldName = this.name;
        this.name = name;
        getPcs().firePropertyChange("name", oldName, name);
    }

    public long getTotalSeconds() {
        return totalSeconds;
    }

    public void setTotalSeconds(long totalSeconds) {
        long oldTotalSeconds = this.totalSeconds;
        this.totalSeconds = totalSeconds;
        getPcs().firePropertyChange("totalSeconds", oldTotalSeconds, totalSeconds);
    }

    public long getRemainingSeconds() {
        return remainingSeconds;
    }

    public void setRemainingSeconds(long remainingSeconds) {
        long oldRemainingSeconds = this.remainingSeconds;
        this.remainingSeconds = remainingSeconds;
        getPcs().firePropertyChange("remainingSeconds", oldRemainingSeconds, remainingSeconds);
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        Status oldStatus = this.status;
        this.status = status;
        getPcs().firePropertyChange("status", oldStatus, status);
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        String oldNotes = this.notes;
        this.notes = notes;
        getPcs().firePropertyChange("notes", oldNotes, notes);
    }

    public PropertyChangeSupport getPcs() {
        if (pcs == null) {
            pcs = new PropertyChangeSupport(this);
        }
        return pcs;
    }

    public void addPropertyChangeListener(PropertyChangeListener listener) {
        getPcs().addPropertyChangeListener(listener);
    }

    public void removePropertyChangeListener(PropertyChangeListener listener) {
        getPcs().removePropertyChangeListener(listener);
    }

    public boolean isRunning() {
        return status == Status.RUNNING;
    }

    public boolean isFinished() {
        return status == Status.FINISHED;
    }

    public boolean isPaused() {
        return status == Status.PAUSED;
    }

    public void start() {
        if (status == Status.IDLE || status == Status.PAUSED) {
            Status old = status;
            status = Status.RUNNING;
            getPcs().firePropertyChange("status", old, Status.RUNNING);
        }
    }

    public void pause() {
        if (status == Status.RUNNING) {
            status = Status.PAUSED;
            getPcs().firePropertyChange("status", Status.RUNNING, Status.PAUSED);
        }
    }

    public void reset() {
        Status old = status;
        long oldRemaining = remainingSeconds;
        status = Status.IDLE;
        remainingSeconds = totalSeconds;
        getPcs().firePropertyChange("status", old, Status.IDLE);
        getPcs().firePropertyChange("remainingSeconds", oldRemaining, remainingSeconds);
    }

    public void decrement() {
        if (status == Status.RUNNING) {
            long oldRemaining = remainingSeconds;
            remainingSeconds--;
            getPcs().firePropertyChange("remainingSeconds", oldRemaining, remainingSeconds);
            if (remainingSeconds <= 0) {
                remainingSeconds = 0;
                status = Status.FINISHED;
                getPcs().firePropertyChange("status", Status.RUNNING, Status.FINISHED);
            }
        }
    }

    public enum Status {
        IDLE,
        RUNNING,
        PAUSED,
        FINISHED
    }
}
