import threading
import time
from unittest.mock import MagicMock

import pytest

from multi_timer.models import TimerState
from multi_timer.timer_engine import TimerEngine


@pytest.fixture
def engine():
    e = TimerEngine()
    yield e
    e.stop()


class TestAddDelete:
    def test_add_timer(self, engine):
        t = engine.add_timer(name="Test", duration=60)
        timers = engine.get_timers()
        assert len(timers) == 1
        assert timers[0].name == "Test"
        assert timers[0].duration == 60
        assert timers[0].remaining == 60.0

    def test_add_multiple_timers(self, engine):
        engine.add_timer(name="A", duration=10)
        engine.add_timer(name="B", duration=20)
        engine.add_timer(name="C", duration=30)
        assert len(engine.get_timers()) == 3

    def test_delete_timer(self, engine):
        t = engine.add_timer(name="Delete Me", duration=10)
        assert engine.delete_timer(t.id)
        assert len(engine.get_timers()) == 0

    def test_delete_nonexistent(self, engine):
        engine.add_timer(name="Keep", duration=10)
        assert not engine.delete_timer("nonexistent-id")
        assert len(engine.get_timers()) == 1

    def test_clear_all(self, engine):
        engine.add_timer(name="A", duration=10)
        engine.add_timer(name="B", duration=20)
        engine.clear_all()
        assert len(engine.get_timers()) == 0


class TestToggleStartPause:
    def test_toggle_starts(self, engine):
        t = engine.add_timer(name="T", duration=60)
        engine.toggle_timer(t.id)
        timers = engine.get_timers()
        assert timers[0].is_running

    def test_toggle_pauses(self, engine):
        t = engine.add_timer(name="T", duration=60)
        engine.toggle_timer(t.id)
        engine.toggle_timer(t.id)
        assert not engine.get_timers()[0].is_running

    def test_start_timer(self, engine):
        t = engine.add_timer(name="T", duration=60)
        engine.start_timer(t.id)
        assert engine.get_timers()[0].is_running

    def test_pause_timer(self, engine):
        t = engine.add_timer(name="T", duration=60)
        engine.start_timer(t.id)
        engine.pause_timer(t.id)
        assert not engine.get_timers()[0].is_running


class TestReset:
    def test_reset_restores_duration(self, engine):
        t = engine.add_timer(name="T", duration=300)
        engine.start_timer(t.id)
        engine.start()
        time.sleep(0.5)
        engine.stop()
        engine.reset_timer(t.id)
        timers = engine.get_timers()
        assert timers[0].remaining == 300.0
        assert not timers[0].is_running

    def test_set_duration(self, engine):
        t = engine.add_timer(name="T", duration=60)
        engine.set_duration(t.id, 120)
        timers = engine.get_timers()
        assert timers[0].duration == 120
        assert timers[0].remaining == 120.0


class TestCountdown:
    def test_countdown_decreases(self, engine):
        t = engine.add_timer(name="T", duration=300)
        engine.start_timer(t.id)
        engine.start()
        time.sleep(1.5)
        engine.stop()
        timers = engine.get_timers()
        assert timers[0].remaining < 300.0

    def test_timer_expiry(self, engine):
        t = engine.add_timer(name="Short", duration=1)
        engine.start_timer(t.id)
        engine.start()
        time.sleep(2.0)
        engine.stop()
        timers = engine.get_timers()
        assert timers[0].remaining == 0.0
        assert not timers[0].is_running

    def test_on_alarm_fires(self, engine):
        callback = MagicMock()
        engine.on_alarm = callback
        t = engine.add_timer(name="Alarm", duration=1)
        engine.start_timer(t.id)
        engine.start()
        time.sleep(2.0)
        engine.stop()
        assert callback.called


class TestReorder:
    def test_move_down(self, engine):
        a = engine.add_timer(name="A", duration=10)
        b = engine.add_timer(name="B", duration=20)
        new_idx = engine.move_timer(0, 1)
        assert new_idx == 1
        timers = engine.get_timers()
        assert timers[0].name == "B"
        assert timers[1].name == "A"

    def test_move_up(self, engine):
        a = engine.add_timer(name="A", duration=10)
        b = engine.add_timer(name="B", duration=20)
        new_idx = engine.move_timer(1, -1)
        assert new_idx == 0
        timers = engine.get_timers()
        assert timers[0].name == "B"
        assert timers[1].name == "A"

    def test_move_at_boundary(self, engine):
        engine.add_timer(name="Only", duration=10)
        new_idx = engine.move_timer(0, -1)
        assert new_idx == 0

    def test_move_down_at_end(self, engine):
        engine.add_timer(name="A", duration=10)
        engine.add_timer(name="B", duration=20)
        new_idx = engine.move_timer(1, 1)
        assert new_idx == 1


class TestUpdateFields:
    def test_update_name(self, engine):
        t = engine.add_timer(name="Old", duration=10)
        engine.update_name(t.id, "New")
        assert engine.get_timers()[0].name == "New"

    def test_update_notes(self, engine):
        t = engine.add_timer(name="T", duration=10)
        engine.update_notes(t.id, "Some notes")
        assert engine.get_timers()[0].notes == "Some notes"


class TestThreadSafety:
    def test_concurrent_add_delete(self, engine):
        errors = []

        def worker(offset):
            try:
                for i in range(50):
                    t = engine.add_timer(name=f"T-{offset}-{i}", duration=10)
                    if i % 3 == 0:
                        engine.delete_timer(t.id)
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors
        assert len(engine.get_timers()) > 0
