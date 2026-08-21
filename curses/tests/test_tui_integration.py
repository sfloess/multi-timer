import os
import time

import pexpect
import pytest


CURSES_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@pytest.fixture
def tui(tmp_path):
    env = os.environ.copy()
    env["TERM"] = "xterm-256color"
    env["HOME"] = str(tmp_path)
    (tmp_path / ".multi-timer").mkdir()
    child = pexpect.spawn(
        "python3", ["-m", "multi_timer"],
        cwd=CURSES_DIR,
        env=env,
        encoding="utf-8",
        timeout=10,
        dimensions=(40, 100),
    )
    child.delaybeforesend = 0.2
    time.sleep(1.5)
    assert child.isalive(), "App failed to start"
    yield child
    if child.isalive():
        child.send("q")
        child.expect(pexpect.EOF, timeout=5)


class TestTUISmoke:
    def test_launches_and_quits(self, tui):
        assert tui.isalive()
        tui.send("q")
        tui.expect(pexpect.EOF, timeout=5)

    def test_add_timer(self, tui):
        tui.send("a")
        time.sleep(0.5)
        tui.sendline("Smoke Test")
        time.sleep(0.5)
        assert tui.isalive()
        tui.send("q")
        tui.expect(pexpect.EOF, timeout=5)

    def test_toggle_timer(self, tui):
        tui.send("a")
        time.sleep(0.5)
        tui.sendline("Toggle Test")
        time.sleep(0.5)
        tui.send("\r")
        time.sleep(1)
        tui.send("\r")
        time.sleep(0.5)
        assert tui.isalive()
        tui.send("q")
        tui.expect(pexpect.EOF, timeout=5)

    def test_delete_timer(self, tui):
        tui.send("a")
        time.sleep(0.5)
        tui.sendline("Delete Me")
        time.sleep(0.5)
        tui.send("d")
        time.sleep(0.5)
        assert tui.isalive()
        tui.send("q")
        tui.expect(pexpect.EOF, timeout=5)

    def test_reset_timer(self, tui):
        tui.send("a")
        time.sleep(0.5)
        tui.sendline("Reset Test")
        time.sleep(0.5)
        tui.send("\r")
        time.sleep(1)
        tui.send("r")
        time.sleep(0.5)
        assert tui.isalive()
        tui.send("q")
        tui.expect(pexpect.EOF, timeout=5)

    def test_persistence(self, tui, tmp_path):
        tui.send("a")
        time.sleep(0.5)
        tui.sendline("Persistent")
        time.sleep(0.5)
        assert tui.isalive()
        tui.send("q")
        tui.expect(pexpect.EOF, timeout=5)
        timers_file = tmp_path / ".multi-timer" / "timers.json"
        assert timers_file.exists()
