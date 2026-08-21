#!/usr/bin/env python3
"""Entry point for multi-timer curses app."""

import curses
from multi_timer.app import main as app_main


def run():
    curses.wrapper(app_main)


if __name__ == "__main__":
    run()
