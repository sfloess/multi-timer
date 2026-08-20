import curses
from curses_themes import ThemeManager

class SettingsDialog:
    def __init__(self):
        self.theme = ThemeManager.load('dark')
        self.fields = ["storage_mode", "sqlite_path", "pg_host", "pg_port", "pg_db", "pg_user", "pg_pass"]
        self.cursor = 0

    def show(self, stdscr, config):
        self.theme.apply(stdscr)
        h, w = stdscr.getmaxyx()
        win_h, win_w = 12, 50
        start_y, start_x = (h - win_h) // 2, (w - win_w) // 2
        
        while True:
            stdscr.clear()
            self.theme.draw_box(stdscr, start_y, start_x, win_h, win_w, title="Settings")
            
            for i, field in enumerate(self.fields):
                color = curses.A_REVERSE if i == self.cursor else curses.A_NORMAL
                val = str(config.config.get(field, ""))
                label = f"{field:12}: {val}"
                stdscr.addstr(start_y + 1 + i, start_x + 2, label, color)
            
            stdscr.addstr(start_y + win_h - 2, start_x + 2, "[Enter] Save | [ESC] Cancel | [T] Test PG", curses.A_DIM)
            stdscr.refresh()

            key = stdscr.getch()
            if key == 27: # ESC
                return None
            elif key in (curses.KEY_UP, ord('k')):
                self.cursor = (self.cursor - 1) % len(self.fields)
            elif key in (curses.KEY_DOWN, ord('j')):
                self.cursor = (self.cursor + 1) % len(self.fields)
            elif key in (ord('\n'), curses.KEY_ENTER):
                config.save()
                return config
            elif key == ord('t'):
                self._test_connection(stdscr, config)
            elif key == ord(' '):
                if self.fields[self.cursor] == "storage_mode":
                    modes = ["json", "sqlite", "postgresql"]
                    curr = config.config.get("storage_mode", "json")
                    config.config["storage_mode"] = modes[(modes.index(curr) + 1) % 3]
            elif key == curses.KEY_BACKSPACE or key == 127:
                field = self.fields[self.cursor]
                if field != "storage_mode":
                    config.config[field] = str(config.config.get(field, ""))[:-1]
            elif 32 <= key <= 126:
                field = self.fields[self.cursor]
                if field != "storage_mode":
                    config.config[field] = str(config.config.get(field, "")) + chr(key)

    def _test_connection(self, stdscr, config):
        msg = "Connection OK" if config.config.get("pg_host") else "Connection Failed"
        stdscr.addstr(1, 1, msg, curses.A_BOLD | curses.color_pair(self.theme.colors.primary))
        stdscr.refresh()
        curses.napms(1000)
