"""JSON persistence module for multi_timer application."""

import json
import os
from pathlib import Path
from typing import List, Optional, Union

try:
    from multi_timer.models import TimerState
except ImportError:
    from multi_timer.app import TimerState

DEFAULT_DIR = Path.home() / ".multi-timer"
DEFAULT_FILENAME = "timers.json"
DEFAULT_PATH = DEFAULT_DIR / DEFAULT_FILENAME


def get_default_path() -> Path:
    """Get default storage path for timer data."""
    return DEFAULT_PATH


def save_timers(timers: List[TimerState], path: Optional[Union[str, Path]] = None) -> bool:
    """Save a list of TimerState instances to a JSON file.

    Args:
        timers: List of TimerState objects to save.
        path: Optional custom file path. Defaults to ~/.multi-timer/timers.json.

    Returns:
        bool: True if save succeeded, False otherwise.
    """
    target_path = Path(path) if path else DEFAULT_PATH
    try:
        target_path.parent.mkdir(parents=True, exist_ok=True)
        data = []
        for timer in timers:
            if hasattr(timer, "to_dict"):
                timer_dict = timer.to_dict()
            else:
                timer_dict = {
                    "id": getattr(timer, "id", ""),
                    "name": getattr(timer, "name", "New Timer"),
                    "duration": getattr(timer, "duration", 3600),
                    "remaining": getattr(timer, "remaining", 3600),
                    "is_running": False,
                    "notes": getattr(timer, "notes", ""),
                }
            timer_dict["is_running"] = False
            data.append(timer_dict)

        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception:
        return False


def load_timers(path: Optional[Union[str, Path]] = None) -> List[TimerState]:
    """Load TimerState instances from a JSON file.

    Args:
        path: Optional custom file path. Defaults to ~/.multi-timer/timers.json.

    Returns:
        List[TimerState]: List of loaded timer instances. Empty list if file does not exist or fails.
    """
    target_path = Path(path) if path else DEFAULT_PATH
    if not target_path.exists():
        return []

    try:
        with open(target_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            return []

        timers = []
        for item in data:
            if isinstance(item, dict):
                timer_kwargs = {}
                if "id" in item and item["id"]:
                    timer_kwargs["id"] = item["id"]
                if "name" in item:
                    timer_kwargs["name"] = item["name"]
                if "duration" in item:
                    timer_kwargs["duration"] = item["duration"]
                if "remaining" in item:
                    timer_kwargs["remaining"] = item["remaining"]
                else:
                    timer_kwargs["remaining"] = timer_kwargs.get("duration", 3600)
                timer_kwargs["is_running"] = False
                if "notes" in item:
                    timer_kwargs["notes"] = item["notes"]

                timer = TimerState(**timer_kwargs)
                timers.append(timer)
        return timers
    except Exception:
        return []


def clear_saved_timers(path: Optional[Union[str, Path]] = None) -> bool:
    """Delete the saved timers file.

    Args:
        path: Optional custom file path.

    Returns:
        bool: True if file was deleted or did not exist, False on error.
    """
    target_path = Path(path) if path else DEFAULT_PATH
    try:
        if target_path.exists():
            target_path.unlink()
        return True
    except Exception:
        return False
