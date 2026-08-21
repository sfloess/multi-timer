#!/usr/bin/env python3
"""Multi-model consensus pipeline using FreeModelRouter arbiter/workers.

All design, coding, review, and meta-review done by FREE models via
FreeModelRouter's built-in consensus_chat():
  - Workers: N diverse models fan out concurrently across providers
  - Arbiter: separate model (different provider) synthesizes consensus

Claude is the orchestrator only — free models do all creative work.

Usage:
    python3 consensus.py design                # Design consensus (5 workers)
    python3 consensus.py review [path]         # Code review (5 workers)
    python3 consensus.py meta                  # Meta-review (5 workers)
    python3 consensus.py fix                   # Generate fixes (5 workers)
    python3 consensus.py full                  # Run entire pipeline
"""

import asyncio
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "tools"))
from fmr_consensus import FMRConsensus

OUTPUT_DIR = os.environ.get("OUTPUT_DIR", ".")


def extract_code_blocks(text):
    files = {}
    for match in re.finditer(
        r'(?:\*\*|###?\s*|`)([\w/.@-]+\.(?:tsx?|json|css|js|kt|java|cs|py|swift))\s*(?:\*\*|`)?'
        r'\s*\n```\w*\n(.*?)```',
        text, re.DOTALL
    ):
        files[match.group(1).strip()] = match.group(2).strip()
    return files


def write_generated_files(files, base_dir):
    written = []
    for path, content in files.items():
        full_path = os.path.join(base_dir, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w") as f:
            f.write(content + "\n")
        written.append(path)
        print(f"  [WROTE] {path} ({len(content)} chars)")
    return written


def read_source_files(code_path):
    files = {}
    for ext in ("**/*.kt", "**/*.java", "**/*.cs", "**/*.swift", "**/*.py"):
        for f in glob.glob(os.path.join(code_path, ext), recursive=True):
            if not any(skip in f for skip in ("node_modules", "build", "target", ".gradle")):
                with open(f) as fh:
                    content = fh.read()
                    if content.strip():
                        files[os.path.relpath(f, code_path)] = content
    return files


async def run_design(fmr):
    """Design phase: 5-worker + arbiter consensus on architecture."""
    prompt = """Design a cross-platform multi-timer application.

Platforms: Java Swing (JAR), Windows WPF (.NET 8), Linux curses (Python),
           Android (Kotlin/Jetpack Compose), iOS (SwiftUI)

Requirements:
1. Multiple independent countdown timers with editable names
2. Start/Pause/Reset per timer, time picker for duration
3. Notes per timer, toolbar for Add/Delete/Reorder/Clear
4. Alert/notification when timer reaches zero
5. SQLite and PostgreSQL database support with configuration UI
6. Dark theme, modern styling

Provide: component architecture per platform, state management,
data model, key libraries, UI layout, platform considerations."""

    print("\n--- DESIGN (5 workers + arbiter) ---")
    result = await fmr.design(prompt)

    with open("design-consensus.json", "w") as f:
        json.dump({"consensus": result.content, "model": result.model}, f, indent=2)

    print(f"\n{'='*60}\nDESIGN CONSENSUS ({result.provider}/{result.model})\n{'='*60}")
    print(result.content[:2000])
    return result


async def run_review(fmr, code_path=None):
    """Review phase: 5-worker + arbiter consensus code review."""
    if code_path is None:
        code_path = OUTPUT_DIR

    files = read_source_files(code_path)
    if not files:
        print("[ERROR] No source files found to review")
        return None

    code_block = "\n".join(f"--- {p} ---\n{c}" for p, c in files.items())
    print(f"\n--- REVIEW {len(files)} files (5 workers + arbiter) ---")

    result = await fmr._consensus_call(
        system=(
            "You are an expert code reviewer. Review for compilation errors, "
            "bugs, security issues, performance problems, and cross-platform "
            "compatibility. Be specific: quote file/line, suggest concrete "
            "fixes, rate severity (CRITICAL/HIGH/MEDIUM/LOW)."
        ),
        user=f"Review this multi-timer application code:\n\n{code_block}",
        n_workers=5,
        temperature=0.3,
    )

    with open("review-consensus.json", "w") as f:
        json.dump({"consensus": result.content, "model": result.model}, f, indent=2)

    print(f"\n{'='*60}\nREVIEW CONSENSUS\n{'='*60}")
    print(result.content[:2000])
    return result


async def run_meta_review(fmr):
    """Meta-review: 5-worker + arbiter consensus on review findings."""
    try:
        with open("review-consensus.json") as f:
            review = json.load(f)
    except FileNotFoundError:
        print("No review-consensus.json. Run review first.")
        return None

    prompt = f"""Meta-review of code review findings for a multi-timer app.

REVIEW FINDINGS:
{review['consensus'][:8000]}

Tasks:
1. Which findings are CONFIRMED (high confidence)?
2. Which are FALSE POSITIVES?
3. What did the review MISS?
4. PRIORITIZED action list?

Output JSON:
{{
  "confirmed": [{{"severity": "...", "file": "...", "issue": "...", "fix": "..."}}],
  "false_positives": ["..."],
  "missing": ["..."],
  "priority_order": ["..."]
}}"""

    print("\n--- META-REVIEW (5 workers + arbiter) ---")
    result = await fmr._consensus_call(
        system="You are a principal engineer performing meta-review. Output structured JSON.",
        user=prompt,
        n_workers=5,
        temperature=0.3,
    )

    with open("meta-review-consensus.json", "w") as f:
        json.dump({"consensus": result.content, "model": result.model}, f, indent=2)

    print(f"\n{'='*60}\nMETA-REVIEW CONSENSUS\n{'='*60}")
    print(result.content[:2000])
    return result


async def run_fix(fmr):
    """Fix phase: 5-worker + arbiter consensus on code fixes."""
    try:
        with open("meta-review-consensus.json") as f:
            meta = json.load(f)
    except FileNotFoundError:
        print("No meta-review-consensus.json. Run meta first.")
        return None

    files = read_source_files(OUTPUT_DIR)
    code_block = "\n".join(f"--- {p} ---\n{c}" for p, c in files.items())

    result = await fmr.generate(
        f"""Apply fixes based on code review findings.

CURRENT CODE:
{code_block[:12000]}

META-REVIEW FINDINGS:
{meta['consensus'][:6000]}

For each file that needs changes, output the COMPLETE updated file:
**path/to/file.ext**
```lang
// complete file content
```

Only output files that need changes. Include FULL content (not diffs)."""
    )

    fixed_files = extract_code_blocks(result.content)
    if fixed_files:
        print(f"\n--- Applying {len(fixed_files)} fixes ---")
        write_generated_files(fixed_files, OUTPUT_DIR)

    with open("fix-consensus.json", "w") as f:
        json.dump({"consensus": result.content, "model": result.model}, f, indent=2)
    return result


async def run_full():
    """Full pipeline: design -> review -> meta -> fix -> verify."""
    fmr = FMRConsensus(n_workers_default=5)
    await fmr.init()

    for i, (name, fn) in enumerate([
        ("DESIGN", lambda: run_design(fmr)),
        ("CODE REVIEW", lambda: run_review(fmr)),
        ("META-REVIEW", lambda: run_meta_review(fmr)),
        ("APPLY FIXES", lambda: run_fix(fmr)),
        ("VERIFICATION REVIEW", lambda: run_review(fmr)),
    ], 1):
        print(f"\n{'#'*60}\n# PHASE {i}: {name} (5 workers + arbiter)\n{'#'*60}")
        await fn()

    print(f"\n{'='*60}\nPIPELINE COMPLETE\n{'='*60}")


async def main():
    phase = sys.argv[1] if len(sys.argv) > 1 else "full"

    if phase == "full":
        await run_full()
        return

    fmr = FMRConsensus(n_workers_default=5)
    await fmr.init()

    phases = {"design": run_design, "review": run_review, "meta": run_meta_review, "fix": run_fix}
    if phase in phases:
        if phase == "review" and len(sys.argv) > 2:
            await phases[phase](fmr, sys.argv[2])
        else:
            await phases[phase](fmr)
    else:
        print(f"Unknown: {phase}. Use: design|review|meta|fix|full")


if __name__ == "__main__":
    asyncio.run(main())
