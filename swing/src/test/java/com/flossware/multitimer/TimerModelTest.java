package com.flossware.multitimer;

import com.flossware.multitimer.model.TimerModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.beans.PropertyChangeEvent;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TimerModelTest {

    private TimerModel timer;

    @BeforeEach
    void setUp() {
        timer = new TimerModel("Test", 300);
    }

    @Test
    void constructorSetsDefaults() {
        assertEquals("Test", timer.getName());
        assertEquals(300, timer.getTotalSeconds());
        assertEquals(300, timer.getRemainingSeconds());
        assertEquals(TimerModel.Status.IDLE, timer.getStatus());
        assertEquals("", timer.getNotes());
        assertNotNull(timer.getId());
    }

    @Test
    void startFromIdle() {
        timer.start();
        assertEquals(TimerModel.Status.RUNNING, timer.getStatus());
        assertTrue(timer.isRunning());
    }

    @Test
    void startFromPaused() {
        timer.start();
        timer.pause();
        timer.start();
        assertTrue(timer.isRunning());
    }

    @Test
    void startWhenFinishedDoesNothing() {
        timer.start();
        while (timer.getRemainingSeconds() > 0) {
            timer.decrement();
        }
        assertTrue(timer.isFinished());
        timer.start();
        assertTrue(timer.isFinished());
    }

    @Test
    void pauseStopsRunning() {
        timer.start();
        timer.pause();
        assertTrue(timer.isPaused());
        assertFalse(timer.isRunning());
    }

    @Test
    void pauseWhenNotRunningDoesNothing() {
        timer.pause();
        assertEquals(TimerModel.Status.IDLE, timer.getStatus());
    }

    @Test
    void resetRestoresState() {
        timer.start();
        timer.decrement();
        timer.decrement();
        timer.reset();
        assertEquals(TimerModel.Status.IDLE, timer.getStatus());
        assertEquals(300, timer.getRemainingSeconds());
    }

    @Test
    void decrementReducesRemaining() {
        timer.start();
        timer.decrement();
        assertEquals(299, timer.getRemainingSeconds());
    }

    @Test
    void decrementWhenNotRunningDoesNothing() {
        long before = timer.getRemainingSeconds();
        timer.decrement();
        assertEquals(before, timer.getRemainingSeconds());
    }

    @Test
    void decrementToZeroFinishes() {
        TimerModel shortTimer = new TimerModel("Short", 2);
        shortTimer.start();
        shortTimer.decrement();
        assertEquals(1, shortTimer.getRemainingSeconds());
        assertTrue(shortTimer.isRunning());
        shortTimer.decrement();
        assertEquals(0, shortTimer.getRemainingSeconds());
        assertTrue(shortTimer.isFinished());
    }

    @Test
    void propertyChangeOnDecrement() {
        List<PropertyChangeEvent> events = new ArrayList<>();
        timer.addPropertyChangeListener(events::add);
        timer.start();
        events.clear();

        timer.decrement();

        assertEquals(1, events.size());
        PropertyChangeEvent e = events.get(0);
        assertEquals("remainingSeconds", e.getPropertyName());
        assertEquals(300L, e.getOldValue());
        assertEquals(299L, e.getNewValue());
    }

    @Test
    void propertyChangeOnFinish() {
        TimerModel shortTimer = new TimerModel("Short", 1);
        List<PropertyChangeEvent> events = new ArrayList<>();
        shortTimer.addPropertyChangeListener(events::add);
        shortTimer.start();
        events.clear();

        shortTimer.decrement();

        assertEquals(2, events.size());
        assertEquals("remainingSeconds", events.get(0).getPropertyName());
        assertEquals("status", events.get(1).getPropertyName());
        assertEquals(TimerModel.Status.RUNNING, events.get(1).getOldValue());
        assertEquals(TimerModel.Status.FINISHED, events.get(1).getNewValue());
    }

    @Test
    void setNameFiresEvent() {
        List<PropertyChangeEvent> events = new ArrayList<>();
        timer.addPropertyChangeListener(events::add);

        timer.setName("Renamed");

        assertEquals("Renamed", timer.getName());
        assertEquals(1, events.size());
        assertEquals("name", events.get(0).getPropertyName());
    }

    @Test
    void setNotesFiresEvent() {
        List<PropertyChangeEvent> events = new ArrayList<>();
        timer.addPropertyChangeListener(events::add);

        timer.setNotes("Do the thing");

        assertEquals("Do the thing", timer.getNotes());
        assertEquals(1, events.size());
        assertEquals("notes", events.get(0).getPropertyName());
    }
}
