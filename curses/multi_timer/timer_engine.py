"""Timer countdown engine using threading."""

import sys
import time
import threading
from typing import List, Optional, Callable

from multi_timer.models import TimerState


class TimerEngine:
    """Engine managing multiple timer countdowns in a background thread."""

    def __init__(
        self,
        timers: Optional[List[TimerState]] = None,
        on_alarm: Optional[Callable[[TimerState], None]] = None,
    ) -> None:
        self.timers: List[TimerState] = timers if timers is not None else []
        self.lock = threading.Lock()
        self.running = threading.Event()
        self.thread: Optional[threading.Thread] = None
        self.on_alarm: Optional[Callable[[TimerState], None]] = on_alarm

    def add_timer(
        self, name: str = "New Timer", duration: int = 3600, notes: str = ""
    ) -> TimerState:
        """Add a new timer and return its state."""
        timer = TimerState(
            name=name,
            duration=duration,
            remaining=float(duration),
            notes=notes,
        )
        with self.lock:
            self.timers.append(timer)
        return timer

    def delete_timer(self, timer_id: str) -> bool:
        """Delete timer by ID. Returns True if found and deleted."""
        with self.lock:
            initial_len = len(self.timers)
            self.timers = [t for t in self.timers if t.id != timer_id]
            return len(self.timers) < initial_len

    def toggle_timer(self, timer_id: str) -> None:
        """Toggle running state of a timer."""
        with self.lock:
            for t in self.timers:
                if t.id == timer_id:
                    if t.remaining <= 0:
                        t.remaining = float(t.duration)
                    t.is_running = not t.is_running
                    if hasattr(t, "is_expired"):
                        t.is_expired = False
                    break

    def start_timer(self, timer_id: str) -> None:
        """Start a specific timer."""
        with self.lock:
            for t in self.timers:
                if t.id == timer_id:
                    if t.remaining <= 0:
                        t.remaining = float(t.duration)
                    t.is_running = True
                    if hasattr(t, "is_expired"):
                        t.is_expired = False
                    break

    def pause_timer(self, timer_id: str) -> None:
        """Pause a specific timer."""
        with self.lock:
            for t in self.timers:
                if t.id == timer_id:
                    t.is_running = False
                    break

    def reset_timer(self, timer_id: str) -> None:
        """Reset a timer to its original duration."""
        with self.lock:
            for t in self.timers:
                if t.id == timer_id:
                    t.is_running = False
                    t.remaining = float(t.duration)
                    if hasattr(t, "is_expired"):
                        t.is_expired = False
                    break

    def set_duration(self, timer_id: str, duration: int) -> None:
        """Set new duration for a timer and reset its remaining time."""
        with self.lock:
            for t in self.timers:
                if t.id == timer_id:
                    t.duration = max(0, duration)
                    t.remaining = float(t.duration)
                    t.is_running = False
                    if hasattr(t, "is_expired"):
                        t.is_expired = False
                    break

    def update_name(self, timer_id: str, name: str) -> None:
        """Update timer name."""
        with self.lock:
            for t in self.timers:
                if t.id == timer_id:
                    t.name = name
                    break

    def update_notes(self, timer_id: str, notes: str) -> None:
        """Update notes for a timer."""
        with self.lock:
            for t in self.timers:
                if t.id == timer_id:
                    t.notes = notes
                    break

    def move_timer(self, index: int, direction: int) -> int:
        """Move timer at index up (direction=-1) or down (direction=1).

        Returns the new index of the moved timer.
        """
        with self.lock:
            new_index = index + direction
            if 0 <= index < len(self.timers) and 0 <= new_index < len(self.timers):
                self.timers[index], self.timers[new_index] = (
                    self.timers[new_index],
                    self.timers[index],
                )
                return new_index
            return index

    def clear_all(self) -> None:
        """Clear all timers."""
        with self.lock:
            self.timers.clear()

    def get_timers(self) -> List[TimerState]:
        """Get copy of current timers list."""
        with self.lock:
            return list(self.timers)

    def set_timers(self, timers: List[TimerState]) -> None:
        """Replace current list of timers."""
        with self.lock:
            self.timers = list(timers)

    def acknowledge_alarm(self, timer_id: str) -> None:
        """Dismiss alarm state for a timer."""
        with self.lock:
            for t in self.timers:
                if t.id == timer_id and hasattr(t, "is_expired"):
                    t.is_expired = False
                    break

    def _loop(self) -> None:
        """Background countdown worker loop."""
        last_time = time.monotonic()
        while self.running.is_set():
            time.sleep(0.1)
            now = time.monotonic()
            elapsed = now - last_time
            last_time = now

            alarm_timers: List[TimerState] = []
            with self.lock:
                for t in self.timers:
                    if t.is_running and t.remaining > 0:
                        t.remaining -= elapsed
                        if t.remaining <= 0:
                            t.remaining = 0.0
                            t.is_running = False
                            if hasattr(t, "is_expired"):
                                t.is_expired = True
                            alarm_timers.append(t)

            for t in alarm_timers:
                sys.stdout.write("\a")
                sys.stdout.flush()
                if self.on_alarm:
                    try:
                        self.on_alarm(t)
                    except Exception:
                        pass

    def start(self) -> None:
        """Start the background countdown thread."""
        if not self.running.is_set():
            self.running.set()
            self.thread = threading.Thread(target=self._loop, daemon=True)
            self.thread.start()

    def stop(self) -> None:
        """Stop the background countdown thread."""
        self.running.clear()
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
