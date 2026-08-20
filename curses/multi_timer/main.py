#!/usr/bin/env python3
"""Entry point for multi-timer curses app."""

import curses
from multi_timer.app import MultiTimerApp


def run():
    app = MultiTimerApp()
    curses.wrapper(app.run)


if __name__ == "__main__":
    run()
