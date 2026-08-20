package com.flossware.multitimer.model;

import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeSupport;
import java.util.UUID;

public class TimerModel {

    public enum Status {
        IDLE,
        RUNNING,
        PAUSED,
        FINISHED
    }

    private String id;
    private String name;
    private long totalSeconds;
    private long remainingSeconds;
    private Status status;
    private String notes;

    private transient PropertyChangeSupport pcs;

    public TimerModel() {
        this("Timer", 300);
    }

    public TimerModel(String name, long totalSeconds) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.totalSeconds = Math.max(0, totalSeconds);
        this.remainingSeconds = this.totalSeconds;
        this.status = Status.IDLE;
        this.notes = "";
        this.pcs = new PropertyChangeSupport(this);
    }

    private PropertyChangeSupport getPcs() {
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

    public String getId() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        String oldName = this.name;
        this.name = name != null ? name : "";
        getPcs().firePropertyChange("name", oldName, this.name);
    }

    public long getTotalSeconds() {
        return totalSeconds;
    }

    public void setTotalSeconds(long totalSeconds) {
        long oldTotal = this.totalSeconds;
        this.totalSeconds = Math.max(0, totalSeconds);
        getPcs().firePropertyChange("totalSeconds", oldTotal, this.totalSeconds);

        if (status == Status.IDLE || status == Status.FINISHED) {
            setRemainingSeconds(this.totalSeconds);
        }
    }

    public long getRemainingSeconds() {
        return remainingSeconds;
    }

    public void setRemainingSeconds(long remainingSeconds) {
        long oldRemaining = this.remainingSeconds;
        this.remainingSeconds = Math.max(0, remainingSeconds);
        getPcs().firePropertyChange("remainingSeconds", oldRemaining, this.remainingSeconds);
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        Status oldStatus = this.status;
        this.status = status != null ? status : Status.IDLE;
        getPcs().firePropertyChange("status", oldStatus, this.status);
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        String oldNotes = this.notes;
        this.notes = notes != null ? notes : "";
        getPcs().firePropertyChange("notes", oldNotes, this.notes);
    }

    public boolean isRunning() {
        return status == Status.RUNNING;
    }

    public synchronized void decrement() {
        if (status == Status.RUNNING && remainingSeconds > 0) {
            long oldRemaining = remainingSeconds;
            remainingSeconds--;
            getPcs().firePropertyChange("remainingSeconds", oldRemaining, remainingSeconds);

            if (remainingSeconds == 0) {
                setStatus(Status.FINISHED);
            }
        }
    }

    public void start() {
        if (remainingSeconds <= 0) {
            setRemainingSeconds(totalSeconds);
        }
        if (remainingSeconds > 0) {
            setStatus(Status.RUNNING);
        }
    }

    public void pause() {
        if (status == Status.RUNNING) {
            setStatus(Status.PAUSED);
        }
    }

    public void reset() {
        setStatus(Status.IDLE);
        setRemainingSeconds(totalSeconds);
    }
}
