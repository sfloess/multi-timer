import curses
from typing import Optional, Tuple, List

# --------------------------------------------------------------------------- #
# Utility helpers
# --------------------------------------------------------------------------- #

def _center_window(stdscr, height: int, width: int) -> curses.window:
    """Return a new window centered on stdscr."""
    max_y, max_x = stdscr.getmaxyx()
    begin_y = (max_y - height) // 2
    begin_x = (max_x - width) // 2
    return curses.newwin(height, width, begin_y, begin_x)


def _draw_box(win: curses.window, title: str = "") -> None:
    """Draw a box with an optional title."""
    win.box()
    if title:
        win.addstr(0, 2, f" {title} ", curses.A_BOLD)


# --------------------------------------------------------------------------- #
# Name editor
# --------------------------------------------------------------------------- #

def name_editor(stdscr, initial_name: str = "") -> Optional[str]:
    """
    Display a single-line name editor dialog.

    Returns the edited name, or None if cancelled.
    """
    win = _center_window(stdscr, 5, 50)
    _draw_box(win, "Edit Timer Name")
    win.addstr(2, 2, "Name: ")
    curses.curs_set(1)
    win.refresh()

    name = list(initial_name)
    cursor = len(name)
    while True:
        win.move(2, 8 + cursor)
        win.refresh()
        ch = win.getch()
        if ch in (curses.KEY_ENTER, 10, 13):
            return "".join(name).strip()
        elif ch in (27,):  # ESC
            return None
        elif ch in (curses.KEY_BACKSPACE, 127, 8):
            if cursor > 0:
                cursor -= 1
                del name[cursor]
        elif ch in (curses.KEY_DC,):
            if cursor < len(name):
                del name[cursor]
        elif ch in (curses.KEY_LEFT,):
            if cursor > 0:
                cursor -= 1
        elif ch in (curses.KEY_RIGHT,):
            if cursor < len(name):
                cursor += 1
        elif 32 <= ch <= 126:  # printable
            name.insert(cursor, chr(ch))
            cursor += 1
        # ignore other keys


# --------------------------------------------------------------------------- #
# Time picker
# --------------------------------------------------------------------------- #

def time_picker(stdscr, initial: Tuple[int, int, int] = (0, 0, 0)) -> Optional[Tuple[int, int, int]]:
    """
    Display a time picker dialog.

    Returns a tuple (hours, minutes, seconds) or None if cancelled.
    """
    win = _center_window(stdscr, 7, 30)
    _draw_box(win, "Set Timer Duration")
    win.addstr(2, 2, "HH:MM:SS")
    curses.curs_set(1)
    win.refresh()

    h, m, s = initial
    fields = [h, m, s]
    cursor = 0  # 0=hours,1=minutes,2=seconds

    def render():
        win.addstr(3, 4, f"{fields[0]:02d}:{fields[1]:02d}:{fields[2]:02d}")
        win.move(3, 4 + cursor * 3)
        win.refresh()

    render()
    while True:
        ch = win.getch()
        if ch in (curses.KEY_ENTER, 10, 13):
            return tuple(fields)
        elif ch in (27,):  # ESC
            return None
        elif ch in (curses.KEY_LEFT,):
            cursor = (cursor - 1) % 3
        elif ch in (curses.KEY_RIGHT,):
            cursor = (cursor + 1) % 3
        elif ch in (curses.KEY_UP,):
            fields[cursor] = (fields[cursor] + 1) % (60 if cursor < 2 else 24)
        elif ch in (curses.KEY_DOWN,):
            fields[cursor] = (fields[cursor] - 1) % (60 if cursor < 2 else 24)
        elif 48 <= ch <= 57:  # digit
            # Shift existing digit left and set new digit
            val = int(chr(ch))
            fields[cursor] = (fields[cursor] * 10 + val) % (60 if cursor < 2 else 24)
        render()


# --------------------------------------------------------------------------- #
# Notes editor
# --------------------------------------------------------------------------- #

def notes_editor(stdscr, initial_text: str = "") -> Optional[str]:
    """
    Display a multi-line notes editor dialog.

    Returns the edited text, or None if cancelled.
    """
    max_y, max_x = stdscr.getmaxyx()
    height = max_y - 4
    width = max_x - 4
    win = curses.newwin(height, width, 2, 2)
    win.keypad(True)
    curses.curs_set(1)
    win.clear()
    win.border()
    win.addstr(0, 2, " Edit Notes (ESC=Cancel, ENTER=Save) ", curses.A_BOLD)

    lines: List[str] = initial_text.splitlines() if initial_text else [""]
    cursor_y, cursor_x = 0, 0

    def render():
        win.erase()
        win.border()
        win.addstr(0, 2, " Edit Notes (ESC=Cancel, ENTER=Save) ", curses.A_BOLD)
        for idx, line in enumerate(lines):
            if idx + 1 < height - 1:
                win.addstr(idx + 1, 1, line[:width - 2])
        win.move(cursor_y + 1, cursor_x + 1)
        win.refresh()

    render()
    while True:
        ch = win.getch()
        if ch in (10, 13):  # ENTER to save
            return "\n".join(lines)
        elif ch == 27:  # ESC to cancel
            return None
        elif ch in (curses.KEY_BACKSPACE, 127, 8):
            if cursor_x > 0:
                line = lines[cursor_y]
                lines[cursor_y] = line[:cursor_x - 1] + line[cursor_x:]
                cursor_x -= 1
            elif cursor_y > 0:
                prev_line_len = len(lines[cursor_y - 1])
                lines[cursor_y - 1] += lines[cursor_y]
                del lines[cursor_y]
                cursor_y -= 1
                cursor_x = prev_line_len
        elif ch == curses.KEY_DC:
            line = lines[cursor_y]
            if cursor_x < len(line):
                lines[cursor_y] = line[:cursor_x] + line[cursor_x + 1 :]
            elif cursor_y + 1 < len(lines):
                lines[cursor_y] += lines[cursor_y + 1]
                del lines[cursor_y + 1]
        elif ch == curses.KEY_LEFT:
            if cursor_x > 0:
                cursor_x -= 1
            elif cursor_y > 0:
                cursor_y -= 1
                cursor_x = len(lines[cursor_y])
        elif ch == curses.KEY_RIGHT:
            if cursor_x < len(lines[cursor_y]):
                cursor_x += 1
            elif cursor_y + 1 < len(lines):
                cursor_y += 1
                cursor_x = 0
        elif ch == curses.KEY_UP:
            if cursor_y > 0:
                cursor_y -= 1
                cursor_x = min(cursor_x, len(lines[cursor_y]))
        elif ch == curses.KEY_DOWN:
            if cursor_y + 1 < len(lines):
                cursor_y += 1
                cursor_x = min(cursor_x, len(lines[cursor_y]))
        elif ch == curses.KEY_ENTER or ch == 10 or ch == 13:
            # Insert new line
            line = lines[cursor_y]
            new_line = line[cursor_x:]
            lines[cursor_y] = line[:cursor_x]
            lines.insert(cursor_y + 1, new_line)
            cursor_y += 1
            cursor_x = 0
        elif 32 <= ch <= 126:
            line = lines[cursor_y]
            lines[cursor_y] = line[:cursor_x] + chr(ch) + line[cursor_x:]
            cursor_x += 1
        render()
        # Ensure cursor stays within bounds
        if cursor_y >= len(lines):
            cursor_y = len(lines) - 1
        if cursor_x > len(lines[cursor_y]):
            cursor_x = len(lines[cursor_y])
        if cursor_y < 0:
            cursor_y = 0
        if cursor_x < 0:
            cursor_x = 0
        if cursor_y >= height - 2:
            cursor_y = height - 3
        if cursor_x >= width - 2:
            cursor_x = width - 3
        render()
    # unreachable
    return None

# --------------------------------------------------------------------------- #
# End of module
# --------------------------------------------------------------------------- #

