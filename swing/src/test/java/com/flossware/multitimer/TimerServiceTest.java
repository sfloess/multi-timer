package com.flossware.multitimer;

import com.flossware.multitimer.model.TimerModel;
import com.flossware.multitimer.service.SoundService;
import com.flossware.multitimer.service.TimerService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

class TimerServiceTest {

    private AppState state;
    private SoundService soundService;
    private TimerService timerService;

    @BeforeEach
    void setUp() {
        state = new AppState();
        soundService = new SoundService();
        timerService = new TimerService(state, soundService);
    }

    @AfterEach
    void tearDown() {
        timerService.stop();
        soundService.close();
    }

    @Test
    void serviceDecrementsRunningTimers() throws InterruptedException {
        TimerModel t = new TimerModel("Countdown", 300);
        state.addTimer(t);
        t.start();

        timerService.start();
        Thread.sleep(2500);
        timerService.stop();

        assertTrue(t.getRemainingSeconds() < 300);
    }

    @Test
    void serviceIgnoresIdleTimers() throws InterruptedException {
        TimerModel t = new TimerModel("Idle", 300);
        state.addTimer(t);

        timerService.start();
        Thread.sleep(1500);
        timerService.stop();

        assertEquals(300, t.getRemainingSeconds());
    }

    @Test
    void serviceHandlesMultipleTimers() throws InterruptedException {
        TimerModel running = new TimerModel("Running", 300);
        TimerModel idle = new TimerModel("Idle", 300);
        state.addTimer(running);
        state.addTimer(idle);
        running.start();

        timerService.start();
        Thread.sleep(2500);
        timerService.stop();

        assertTrue(running.getRemainingSeconds() < 300);
        assertEquals(300, idle.getRemainingSeconds());
    }

    @Test
    void serviceDetectsFinish() throws InterruptedException {
        TimerModel t = new TimerModel("Short", 2);
        state.addTimer(t);
        t.start();

        CountDownLatch latch = new CountDownLatch(1);
        t.addPropertyChangeListener(evt -> {
            if ("status".equals(evt.getPropertyName())
                    && evt.getNewValue() == TimerModel.Status.FINISHED) {
                latch.countDown();
            }
        });

        timerService.start();
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        assertTrue(t.isFinished());
    }
}
