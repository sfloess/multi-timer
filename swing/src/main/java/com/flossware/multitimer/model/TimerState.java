package com.flossware.multitimer.model;

/**
 * Represents the current operational state of a timer.
 */
public enum TimerState {
    /** Timer is set but not yet started or has been reset. */
    IDLE,
    
    /** Timer is currently counting down. */
    RUNNING,
    
    /** Timer has been temporarily stopped. */
    PAUSED,
    
    /** Timer has reached zero and triggered the alarm. */
    COMPLETED
}
