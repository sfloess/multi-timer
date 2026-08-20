import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Dict, Any

class TimerStatus(Enum):
    READY = "READY"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    EXPIRED = "EXPIRED"

@dataclass
class TimerState:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "New Timer"
    duration: int = 0      # Initial duration in seconds
    remaining: int = 0     # Seconds remaining
    is_running: bool = False
    notes: str = ""
    alerted: bool = False  # Whether the alarm has been triggered for this cycle

    @property
    def status(self) -> TimerStatus:
        if self.remaining <= 0:
            return TimerStatus.EXPIRED
        if self.is_running:
            return TimerStatus.RUNNING
        if self.remaining < self.duration:
            return TimerStatus.PAUSED
        return TimerStatus.READY

    def to_dict(self) -> Dict[str, Any]:
        """Convert state to dictionary for JSON persistence."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TimerState':
        """Create a TimerState instance from a dictionary."""
        return cls(**data)

    @staticmethod
    def format_seconds(total_seconds: int) -> str:
        """Helper to format seconds into HH:MM:SS."""
        # Handle negative or zero
        seconds = max(0, total_seconds)
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

    def get_time_string(self) -> str:
        """Returns the remaining time formatted as HH:MM:SS."""
        return self.format_seconds(self.remaining)

    def reset(self):
        """Resets the timer to its original duration."""
        self.remaining = self.duration
        self.is_running = False
        self.alerted = False

    def update_duration(self, h: int, m: int, s: int):
        """Sets a new total duration and resets remaining time."""
        total = (h * 3600) + (m * 60) + s
        self.duration = total
        self.remaining = total
        self.alerted = False
        self.is_running = False
