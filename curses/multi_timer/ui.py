import curses
import time
from multi_timer.engine import TimerEngine

class MultiTimerUI:
    # Color constants matching the dark theme requirements
    COLOR_BG = curses.COLOR_BLACK
    COLOR_PRIMARY = curses.COLOR_BLUE   # #3B82F6 accent
    COLOR_CARD = curses.COLOR_WHITE    # #1E293B card background (white text)
    COLOR_EXPIRE = curses.COLOR_RED    # for expiring timers

    def __init__(self, stdscr, engine):
        self.stdscr = stdscr
        self.engine = engine
        self.timers = engine.timers
        self.selected_idx = 0
        self.pane_windows = {}
        self.max_y, self.max_x = self.stdscr.getmaxyx()

        # Initialize color pairs
        curses.start_color()
        curses.init_pair(1, self.COLOR_PRIMARY, self.COLOR_BG)   # blue accent
        curses.init_pair(2, self.COLOR_CARD, self.COLOR_BG)      # card (white)
        curses.init_pair(3, self.COLOR_EXPIRE, self.COLOR_BG)    # red for expiring

        # Toolbar window
        self.toolbar_win = curses.newwin(2, self.max_x, 0, 0)
        self._draw_toolbar()

        # Create panes for each timer
        self._create_panes()

    def _draw_toolbar(self):
        self.toolbar_win.clear()
        self.toolbar_win.box()
        self.toolbar_win.addstr(
            0, 2,
            "Add (a) | Delete (d) | Select ↑↓ | Start/Pause (Enter) | Notes (n) | Reset (r) | Quit (q)"
        )
        self.toolbar_win.refresh()

    def _create_panes(self):
        if not self.timers:
            return
        pane_h = (self.max_y - 2) // len(self.timers)
        for i, timer in enumerate(self.timers):
            y = 2 + i * pane_h
            win = curses.newwin(pane_h, self.max_x - 2, y, 1)
            win.box()
            self.pane_windows[i] = win

    def _draw_pane(self, win, timer, idx):
        win.clear()
        win.box()

        # Name
        win.addstr(1, 2, f"Name: {timer.name}")

        # Time display HH:MM:SS
        h = timer.remaining // 3600
        m = (timer.remaining % 3600) // 60
        s = timer.remaining % 60
        time_str = f"{h:02d}:{m:02d}:{s:02d}"
        if timer.remaining <= 30:
            win.attron(curses.color_pair(3))  # red for expiring
        else:
            win.attron(curses.color_pair(2))  # card color
        win.addstr(3, 2, f"Time: {time_str}")
        win.attroff(curses.color_pair(3) if timer.remaining <= 30 else curses.color_pair(2))

        # Buttons
        btn_y = pane_h - 3
        win.addstr(btn_y, 2, "Start/Pause ")
        win.addstr(btn_y, 10, "Reset")

        # Notes (truncate if long)
        notes = timer.notes
        if len(notes) > 30:
            notes = notes[:27] + "..."
        win.addstr(pane_h - 1, 2, f"Notes: {notes}")

        # Selection highlight
        if idx == self.selected_idx:
            win.attron(curses.color_pair(1))  # blue highlight
            win.addstr(pane_h - 2, 2, ">>> Selected")
            win.attroff(curses.color_pair(1))

        win.refresh()

    def _redraw_all(self):
        self._draw_toolbar()
        for i, win in self.pane_windows.items():
            timer = self.timers[i]
            self._draw_pane(win, timer, i)

    def handle_key(self, key):
        if key == ord('a'):
            # Add a new timer (default 1 hour)
            name = "New Timer"
            timer = self.engine.add_timer(name=name, h=1, m=0, s=0)
            self.timers.append(timer)
            self._create_panes()
            self.selected_idx = len(self.timers) - 1
        elif key == ord('d'):
            if 0 <= self.selected_idx < len(self.timers):
                timer_id = self.timers[self.selected_idx].id
                self.engine.delete_timer(timer_id)
                self.timers = self.engine.timers
                self._create_panes()
                if self.selected_idx >= len(self.timers):
                    self.selected_idx = max(0, len(self.timers) - 1)
        elif key == curses.KEY_UP:
            self.selected_idx = max(0, self.selected_idx - 1)
        elif key == curses.KEY_DOWN:
            self.selected_idx = min(len(self.timers) - 1, self.selected_idx + 1)
        elif key in (curses.KEY_ENTER, 10):
            if 0 <= self.selected_idx < len(self.timers):
                timer = self.timers[self.selected_idx]
                self.engine.toggle_timer(timer.id)
        elif key == ord('r'):
            if 0 <= self.selected_idx < len(self.timers):
                timer = self.timers[self.selected_idx]
                self.engine.reset_timer(timer.id)
        elif key == ord('n'):
            if 0 <= self.selected_idx < len(self.timers):
                # Prompt for notes
                prompt_win = curses.newwin(5, 40, 10, 0)
                prompt_win.box()
                prompt_win.addstr(1, 2, "Enter note (max 50 chars):")
                prompt_win.addstr(2, 2, self.timers[self.selected_idx].notes)
                prompt_win.refresh()
                curses.echo()
                self.timers[self.selected_idx].notes = prompt_win.getstr(2, 2, 50).decode('utf-8')
                curses.noecho()
                prompt_win.destroy()
        elif key == ord('q'):
            return 'quit'
        return None

    def run(self):
        self.stdscr.halfdelay(5)  # Refresh every 0.5 seconds
        while True:
            try:
                key = self.stdscr.getch()
            except KeyboardInterrupt:
                break
            if key != -1:
                result = self.handle_key(key)
                if result == 'quit':
                    break
            self._redraw_all()
            time.sleep(0.1)
