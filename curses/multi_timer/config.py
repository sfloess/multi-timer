import os
import json
from pathlib import Path

class MultiTimerConfig:
    _CONFIG_DIR = Path.home() / ".multi-timer"
    _CONFIG_PATH = _CONFIG_DIR / "config.json"

    def __init__(self):
        self._ensure_dir()
        self.config = self.load()

    def _ensure_dir(self):
        self._CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    def load(self) -> dict:
        if self._CONFIG_PATH.exists():
            with open(self._CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        return self.default_config()

    def save(self):
        with open(self._CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(self.config, f, indent=2)

    @property
    def storage_mode(self) -> str:
        return self.config.get("storage_mode", "sqlite")

    @storage_mode.setter
    def storage_mode(self, mode: str):
        self.config["storage_mode"] = mode
        self.save()

    @property
    def sqlite_path(self) -> str:
        return self.config.get("sqlite_path", str(self._CONFIG_DIR / "timers.db"))

    @sqlite_path.setter
    def sqlite_path(self, path: str):
        self.config["sqlite_path"] = path
        self.save()

    @property
    def postgres_config(self) -> dict:
        return self.config.get("postgres", {})

    @postgres_config.setter
    def postgres_config(self, cfg: dict):
        self.config["postgres"] = cfg
        self.save()

    def default_config(self) -> dict:
        return {
            "storage_mode": "sqlite",
            "sqlite_path": str(self._CONFIG_DIR / "timers.db"),
            "postgres": {}
        }
