import json

import pytest

from multi_timer.models import TimerState
from multi_timer.persistence import save_timers, load_timers, clear_saved_timers


@pytest.fixture
def timers():
    return [
        TimerState(name="Work", duration=1500, remaining=1500),
        TimerState(name="Break", duration=300, remaining=300, notes="Stretch"),
    ]


class TestSaveLoad:
    def test_save_and_load(self, tmp_path, timers):
        path = tmp_path / "timers.json"
        assert save_timers(timers, path)
        loaded = load_timers(path)
        assert len(loaded) == 2
        assert loaded[0].name == "Work"
        assert loaded[1].name == "Break"
        assert loaded[1].notes == "Stretch"

    def test_load_nonexistent(self, tmp_path):
        loaded = load_timers(tmp_path / "missing.json")
        assert loaded == []

    def test_load_corrupt(self, tmp_path):
        path = tmp_path / "bad.json"
        path.write_text("not json at all {{{")
        loaded = load_timers(path)
        assert loaded == []

    def test_running_timers_saved_as_stopped(self, tmp_path):
        t = TimerState(name="Running", duration=60, remaining=45, is_running=True)
        path = tmp_path / "timers.json"
        save_timers([t], path)
        with open(path) as f:
            data = json.load(f)
        assert data[0]["is_running"] is False

    def test_clear_saved(self, tmp_path, timers):
        path = tmp_path / "timers.json"
        save_timers(timers, path)
        assert path.exists()
        assert clear_saved_timers(path)
        assert not path.exists()

    def test_clear_nonexistent(self, tmp_path):
        assert clear_saved_timers(tmp_path / "nope.json")

    def test_roundtrip_preserves_ids(self, tmp_path):
        t = TimerState(name="Keep ID", duration=60, remaining=60)
        original_id = t.id
        path = tmp_path / "timers.json"
        save_timers([t], path)
        loaded = load_timers(path)
        assert loaded[0].id == original_id
