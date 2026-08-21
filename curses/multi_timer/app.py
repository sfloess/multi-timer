import curses
import json
import os
import threading
import uuid
import time
from dataclasses import dataclass, asdict, field
from typing import List, Optional

@dataclass
class TimerState:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "New Timer"
    duration: int = 3600  # seconds
    remaining: int = 3600
    is_running: bool = False
    notes: str = ""

    def to_dict(self):
        return asdict(self)

class TimerEngine:
    def __init__(self):
        self.timers: List[TimerState] = []
        self.lock = threading.Lock()
        self.running = threading.Event()
        self.thread: Optional[threading.Thread] = None

    def add_timer(self, name="New Timer", h=0, m=0, s=0):
        seconds = h * 3600 + m * 60 + s
        timer = TimerState(name=name, duration=seconds, remaining=seconds)
        with self.lock:
            self.timers.append(timer)
        return timer

    def delete_timer(self, timer_id: str):
        with self.lock:
            self.timers = [t for t in self.timers if t.id != timer_id]

    def toggle_timer(self, timer_id):
        with self.lock:
            for t in self.timers:
                if t.id == timer_id:
                    t.is_running = not t.is_running
                    break

    def reset_timer(self, timer_id):
        with self.lock:
            for t in self.timers:
                if t.id == timer_id:
                    t.is_running = False
                    t.remaining = t.duration
                    break

    def update_notes(self, timer_id: str, notes: str):
        with self.lock:
            for t in self.timers:
                if t.id == timer_id:
                    t.notes = notes
                    break

    def _loop(self):
        while self.running.is_set():
            with self.lock:
                for t in self.timers:
                    if t.is_running and t.remaining > 0:
                        t.remaining -= 1
                        if t.remaining <= 0:
                            t.is_running = False
            time.sleep(1)

    def start(self):
        if not self.running.is_set():
            self.running.set()
            self.thread = threading.Thread(target=self._loop, daemon=True)
            self.thread.start()

    def stop(self):
        self.running.clear()

class Storage:
    PATH = os.path.expanduser("~/.multi-timer")
    FILE = os.path.join(PATH, "timers.json")

    @staticmethod
    def save(timers: List[TimerState]):
        try:
            os.makedirs(Storage.PATH, exist_ok=True)
            data = [t.to_dict() for t in timers]
            with open(Storage.FILE, 'w') as f:
                json.dump(data, f)
        except OSError:
            pass

    @staticmethod
    def load() -> List[TimerState]:
        if not os.path.exists(Storage.FILE):
            return []
        try:
            with open(Storage.FILE, 'r') as f:
                data = json.load(f)
                return [TimerState(**d) for d in data]
        except (json.JSONDecodeError, OSError):
            return []

class TUI:
    def __init__(self, stdscr, engine: TimerEngine):
        self.stdscr = stdscr
        self.engine = engine
        self.selected_idx = 0
        self.inputing = False
        self.init_colors()

    def init_colors(self):
        curses.start_color()
        curses.use_default_colors()
        # Pair: FG, BG
        curses.init_pair(1, curses.COLOR_BLUE, -1)   # Primary #3B82F6-like (-1 is default bg #0F172A-like)
        curses.init_pair(2, curses.COLOR_BLACK, 1) # Inverted
        curses.init_pair(3, curses.COLOR_GREEN, -1) # Running
        curses.init_pair(4, curses.COLOR_RED, -1)   # Alert
        curses.init_pair(5, curses.COLOR_WHITE, 2) # Cards

    def format_time(self, seconds):
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

    def draw(self):
        self.stdscr.clear()
        h, w = self.stdscr.getmaxyx()
        
        # Toolbar
        self.stdscr.attron(curses.color_pair(1))
        self.stdscr.addstr(0, 0, f" MULTI TIMER | [A] Add | [D] Delete | [N] Notes | [R] Reset | [Enter] Toggle | [Q] Quit ".ljust(w))
        self.stdscr.attroff(curses.color_pair(1))

        # List
        with self.engine.lock:
            if self.engine.timers:
                self.selected_idx = min(self.selected_idx, len(self.engine.timers) - 1)
            for i, timer in enumerate(self.engine.timers):
                if i + 3 >= h - 2: break
                
                style = curses.A_NORMAL
                if i == self.selected_idx:
                    style = curses.A_REVERSE
                
                status = "RUNNING" if timer.is_running else "PAUSED"
                if timer.remaining == 0: status = "DONE"
                
                color = curses.color_pair(3) if timer.is_running else curses.color_pair(1)
                if timer.remaining == 0: color = curses.color_pair(4)

                line = f" {status:<8} {timer.name:<20} {self.format_time(timer.remaining)} "
                self.stdscr.addstr(i + 2, 0, line.ljust(w), style | color)

        self.stdscr.refresh()

    def prompt_input(self, title, initial=""):
        curses.curs_set(1)
        h, w = self.stdscr.getmaxyx()
        win = curses.newwin(5, 40, (h-5)//2, (w-40)//2)
        win.box()
        win.addstr(0, 2, f" {title} ")
        win.addstr(2, 2, initial)
        win.refresh()
        
        res = initial
        while True:
            ch = win.getch()
            if ch == 10: # Enter
                break
            elif ch == 127: # Backspace
                res = res[:-1]
                win.addstr(2, 2, " " * 36)
                win.addstr(2, 2, res)
            elif 32 <= ch <= 126:
                res += chr(ch)
                win.addstr(2, 2 + len(res)-1, chr(ch))
        win.clear()
        curses.curs_set(0)
        return res

    def run(self):
        self.stdscr.timeout(100)
        while True:
            self.draw()
            try:
                ch = self.stdscr.getch()
            except curses.error:
                continue

            if ch == -1:
                continue

            if ch == curses.KEY_RESIZE:
                self.stdscr.clear()
                continue

            if ch == ord('q'):
                self.engine.stop()
                with self.engine.lock:
                    Storage.save(self.engine.timers)
                break
            elif ch == curses.KEY_UP:
                self.selected_idx = max(0, self.selected_idx - 1)
            elif ch == curses.KEY_DOWN:
                with self.engine.lock:
                    if self.engine.timers:
                        self.selected_idx = min(len(self.engine.timers) - 1, self.selected_idx + 1)
            elif ch == ord('a'):
                name = self.prompt_input("Name")
                self.engine.add_timer(name)
            elif ch == ord('d'):
                with self.engine.lock:
                    if self.engine.timers:
                        tid = self.engine.timers[self.selected_idx].id
                    else:
                        tid = None
                if tid:
                    self.engine.delete_timer(tid)
                    with self.engine.lock:
                        if self.engine.timers:
                            self.selected_idx = min(self.selected_idx, len(self.engine.timers) - 1)
                        else:
                            self.selected_idx = 0
            elif ch == ord('n'):
                with self.engine.lock:
                    if self.engine.timers:
                        tid = self.engine.timers[self.selected_idx].id
                        current_notes = self.engine.timers[self.selected_idx].notes
                    else:
                        tid = None
                        current_notes = ""
                if tid:
                    notes = self.prompt_input("Notes", current_notes)
                    self.engine.update_notes(tid, notes)
            elif ch == ord('r'):
                with self.engine.lock:
                    tid = self.engine.timers[self.selected_idx].id if self.engine.timers else None
                if tid:
                    self.engine.reset_timer(tid)
            elif ch == 10: # Enter
                with self.engine.lock:
                    tid = self.engine.timers[self.selected_idx].id if self.engine.timers else None
                if tid:
                    self.engine.toggle_timer(tid)

def main(stdscr):
    curses.curs_set(0)
    engine = TimerEngine()
    engine.timers = Storage.load()
    engine.start()
    ui = TUI(stdscr, engine)
    ui.run()

if __name__ == "__main__":
    curses.wrapper(main)
