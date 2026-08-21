#!/usr/bin/env python3
"""FMR arbiter/workers review of project source files.

Usage:
    python3 tools/review.py                    # Review all changed files
    python3 tools/review.py windows android    # Review specific platforms
    python3 tools/review.py path/to/file.kt    # Review specific file
"""

import asyncio
import glob
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from fmr_consensus import FMRConsensus

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PLATFORM_GLOBS = {
    "windows": [f"{BASE}/windows/**/*.cs", f"{BASE}/windows/**/*.xaml"],
    "android": [f"{BASE}/android/app/src/**/*.kt"],
    "swing": [f"{BASE}/swing/src/**/*.java"],
    "curses": [f"{BASE}/curses/**/*.py"],
    "swiftui": [f"{BASE}/swiftui/**/*.swift"],
    "gradle": [f"{BASE}/android/**/*.gradle.kts"],
    "workflows": [f"{BASE}/.github/workflows/*.yml"],
}


def collect_files(args: list[str]) -> list[str]:
    files = []
    for arg in args:
        if arg in PLATFORM_GLOBS:
            for pattern in PLATFORM_GLOBS[arg]:
                files.extend(glob.glob(pattern, recursive=True))
        elif os.path.isfile(arg):
            files.append(arg)
        elif os.path.isfile(os.path.join(BASE, arg)):
            files.append(os.path.join(BASE, arg))
        else:
            print(f"[WARN] Unknown arg: {arg}")
    return sorted(set(files))


async def main():
    args = sys.argv[1:] if len(sys.argv) > 1 else list(PLATFORM_GLOBS.keys())
    files = collect_files(args)

    if not files:
        print("No files found to review.")
        print(f"Usage: python3 {sys.argv[0]} [windows|android|swing|curses|swiftui|gradle|workflows|path/to/file]")
        return

    print(f"=== FMR Arbiter/Workers Review ({len(files)} files) ===\n")
    for f in files:
        print(f"  {os.path.relpath(f, BASE)}")

    fmr = FMRConsensus()
    await fmr.init()

    results = await fmr.review_files(files)

    print(f"\n{'='*60}")
    print(f"REVIEW SUMMARY ({len(results)}/{len(files)} reviewed)")
    print(f"{'='*60}")
    for filepath, resp in results:
        name = os.path.relpath(filepath, BASE)
        first_line = resp.content.strip().split("\n")[0][:100]
        print(f"  {name}: {first_line}")

    print(f"\nAll reviews used {results[0][1].n_workers}-worker + arbiter consensus" if results else "")


if __name__ == "__main__":
    asyncio.run(main())
