package com.flossware.multitimer;

import com.flossware.multitimer.model.TimerModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AppStateTest {

    private AppState state;

    @BeforeEach
    void setUp() {
        state = new AppState();
    }

    @Test
    void startsEmpty() {
        assertTrue(state.getTimers().isEmpty());
    }

    @Test
    void addTimer() {
        TimerModel t = new TimerModel("Test", 60);
        state.addTimer(t);
        assertEquals(1, state.getTimers().size());
        assertSame(t, state.getTimers().get(0));
    }

    @Test
    void removeTimer() {
        TimerModel t = new TimerModel("Test", 60);
        state.addTimer(t);
        state.removeTimer(t);
        assertTrue(state.getTimers().isEmpty());
    }

    @Test
    void clearTimers() {
        state.addTimer(new TimerModel("A", 10));
        state.addTimer(new TimerModel("B", 20));
        state.addTimer(new TimerModel("C", 30));
        state.clearTimers();
        assertTrue(state.getTimers().isEmpty());
    }

    @Test
    void setTimersReplacesList() {
        state.addTimer(new TimerModel("Old", 10));
        var newList = new java.util.ArrayList<TimerModel>();
        newList.add(new TimerModel("New1", 100));
        newList.add(new TimerModel("New2", 200));
        state.setTimers(newList);
        assertEquals(2, state.getTimers().size());
        assertEquals("New1", state.getTimers().get(0).getName());
    }
}
