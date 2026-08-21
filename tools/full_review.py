#!/usr/bin/env python3
"""Parallel FMR arbiter/workers review pipeline.

Runs review, meta-review, and meta-meta-review across all platforms
using FreeModelRouter's consensus_chat() (workers fan out, arbiter synthesizes).

All reviews run in parallel by platform group.
"""

import asyncio
import json
import os
import sys
import glob
import time

sys.path.insert(0, os.path.dirname(__file__))
from fmr_consensus import FMRConsensus

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PLATFORM_GROUPS = {
    "android": {
        "globs": ["android/app/src/**/*.kt", "android/*.gradle.kts", "android/app/*.gradle.kts",
                   "android/settings.gradle.kts", "android/app/src/main/AndroidManifest.xml"],
        "lang": "kotlin",
        "desc": "Android (Kotlin/Jetpack Compose)",
    },
    "swiftui": {
        "globs": ["swiftui/**/*.swift", "swiftui/Package.swift"],
        "lang": "swift",
        "desc": "iOS (SwiftUI)",
    },
    "windows": {
        "globs": ["windows/**/*.cs", "windows/**/*.xaml"],
        "lang": "csharp",
        "desc": "Windows (WPF .NET 8)",
    },
    "swing": {
        "globs": ["swing/src/**/*.java", "swing/pom.xml"],
        "lang": "java",
        "desc": "Java Swing",
    },
    "curses": {
        "globs": ["curses/**/*.py"],
        "lang": "python",
        "desc": "Linux curses (Python)",
    },
    "ci-cd": {
        "globs": [".github/workflows/*.yml"],
        "lang": "yaml",
        "desc": "CI/CD workflows",
    },
    "tools": {
        "globs": ["tools/*.py", "consensus.py"],
        "lang": "python",
        "desc": "FMR consensus tools",
    },
    "docs": {
        "globs": ["README.md", "USER_GUIDE.md"],
        "lang": "markdown",
        "desc": "Documentation",
    },
}


def collect_files(group):
    files = {}
    for pattern in group["globs"]:
        for f in glob.glob(os.path.join(BASE, pattern), recursive=True):
            skip = ("build/", "target/", ".gradle/", "__pycache__/", "node_modules/")
            if not any(s in f for s in skip):
                try:
                    with open(f) as fh:
                        content = fh.read()
                        if content.strip():
                            files[os.path.relpath(f, BASE)] = content
                except (UnicodeDecodeError, IsADirectoryError):
                    pass
    return files


async def review_platform(fmr, name, group):
    files = collect_files(group)
    if not files:
        return {"platform": name, "files": 0, "review": "No files found"}

    code_block = "\n".join(f"--- {p} ---\n{c}" for p, c in files.items())
    char_count = len(code_block)

    print(f"\n  [{name}] Reviewing {len(files)} files ({char_count:,} chars)...")

    try:
        result = await fmr._consensus_call(
            system=(
                f"You are an expert code reviewer specializing in {group['desc']}. "
                "Review for: compilation errors, bugs, security issues, performance "
                "problems, cross-platform compatibility, missing error handling, "
                "and adherence to platform best practices. "
                "Be specific: quote file paths and line numbers, suggest concrete "
                "fixes, rate severity (CRITICAL/HIGH/MEDIUM/LOW). "
                "Also note what's done WELL."
            ),
            user=f"Review this {group['desc']} code:\n\n{code_block[:15000]}",
            n_workers=5,
            temperature=0.3,
            max_tokens=4096,
            retries=3,
        )
        print(f"  [{name}] Done: {result.provider}/{result.model} ({result.elapsed_seconds:.1f}s)")
        return {
            "platform": name,
            "desc": group["desc"],
            "files": len(files),
            "chars": char_count,
            "review": result.content,
            "model": f"{result.provider}/{result.model}",
            "elapsed": result.elapsed_seconds,
        }
    except Exception as e:
        print(f"  [{name}] FAILED: {e}")
        return {"platform": name, "files": len(files), "review": f"FAILED: {e}"}


async def meta_review(fmr, reviews):
    all_findings = "\n\n".join(
        f"=== {r['platform'].upper()} ({r.get('desc', '')}, {r['files']} files) ===\n{r['review'][:3000]}"
        for r in reviews if "FAILED" not in r["review"]
    )

    result = await fmr._consensus_call(
        system=(
            "You are a principal software engineer performing meta-review. "
            "Analyze review findings across ALL platforms of this multi-timer app. "
            "Identify: cross-cutting issues, confirmed vs false positive findings, "
            "missed issues, architectural concerns, and a prioritized action plan."
        ),
        user=f"""Meta-review of code reviews across 8 platform groups for a multi-timer app.

REVIEW FINDINGS:
{all_findings[:20000]}

Tasks:
1. CROSS-CUTTING ISSUES: Problems that affect multiple platforms
2. CONFIRMED FINDINGS: High-confidence issues (multiple reviewers flagged)
3. FALSE POSITIVES: Non-issues that should be dismissed
4. MISSED ISSUES: What the reviews didn't catch
5. ARCHITECTURE: Cross-platform consistency and design concerns
6. PRIORITIZED ACTION PLAN: What to fix first

Output structured analysis with severity ratings.""",
        n_workers=5,
        temperature=0.3,
        max_tokens=4096,
        retries=3,
    )
    return result


async def meta_meta_review(fmr, reviews, meta):
    review_summary = "\n".join(
        f"- {r['platform']}: {r['files']} files, {len(r['review'])} chars of findings"
        for r in reviews
    )

    result = await fmr._consensus_call(
        system=(
            "You are a distinguished engineer performing a meta-meta-review. "
            "Your job is to critically evaluate both the reviews AND the meta-review. "
            "Look for: blind spots in the review process itself, systematic biases, "
            "areas where reviewers agreed too easily (groupthink), findings that "
            "need adversarial verification, and whether the prioritization is correct."
        ),
        user=f"""Meta-meta-review: evaluate the review process for a cross-platform multi-timer app.

PLATFORMS REVIEWED:
{review_summary}

META-REVIEW FINDINGS:
{meta.content[:12000]}

SAMPLE PLATFORM REVIEWS (for process quality check):
{reviews[0]['review'][:3000] if reviews else 'N/A'}

---
{reviews[-1]['review'][:3000] if len(reviews) > 1 else 'N/A'}

Tasks:
1. REVIEW QUALITY: Were the platform reviews thorough enough?
2. BLIND SPOTS: What systematic issues did all reviewers miss?
3. GROUPTHINK: Where did reviewers agree too easily without evidence?
4. ADVERSARIAL CHECK: Which findings need independent verification?
5. PRIORITIZATION AUDIT: Is the meta-review's action plan correct?
6. PROCESS IMPROVEMENTS: How to make future reviews better?
7. FINAL VERDICT: Overall project health rating (1-10) with justification

Be skeptical and contrarian. Challenge assumptions.""",
        n_workers=5,
        temperature=0.4,
        max_tokens=4096,
        retries=3,
    )
    return result


async def main():
    t0 = time.monotonic()
    fmr = FMRConsensus()
    await fmr.init()

    # Phase 1: Parallel reviews across all platform groups
    print(f"\n{'#'*60}")
    print(f"# PHASE 1: PARALLEL REVIEWS (8 groups x 5 workers + arbiter)")
    print(f"{'#'*60}")

    tasks = [review_platform(fmr, name, group) for name, group in PLATFORM_GROUPS.items()]
    reviews = await asyncio.gather(*tasks)

    succeeded = [r for r in reviews if "FAILED" not in r.get("review", "FAILED")]
    print(f"\n  Completed: {len(succeeded)}/{len(reviews)} platform reviews")

    # Save Phase 1 results
    with open(os.path.join(BASE, "review-all.json"), "w") as f:
        json.dump(reviews, f, indent=2)

    # Phase 2: Meta-review
    print(f"\n{'#'*60}")
    print(f"# PHASE 2: META-REVIEW (5 workers + arbiter)")
    print(f"{'#'*60}")

    meta = await meta_review(fmr, succeeded)
    print(f"\n  Meta-review: {meta.provider}/{meta.model} ({meta.elapsed_seconds:.1f}s)")

    with open(os.path.join(BASE, "meta-review-all.json"), "w") as f:
        json.dump({"consensus": meta.content, "model": f"{meta.provider}/{meta.model}"}, f, indent=2)

    # Phase 3: Meta-meta-review
    print(f"\n{'#'*60}")
    print(f"# PHASE 3: META-META-REVIEW (5 workers + arbiter)")
    print(f"{'#'*60}")

    mm = await meta_meta_review(fmr, succeeded, meta)
    print(f"\n  Meta-meta-review: {mm.provider}/{mm.model} ({mm.elapsed_seconds:.1f}s)")

    with open(os.path.join(BASE, "meta-meta-review-all.json"), "w") as f:
        json.dump({"consensus": mm.content, "model": f"{mm.provider}/{mm.model}"}, f, indent=2)

    elapsed = time.monotonic() - t0

    # Summary
    print(f"\n{'='*60}")
    print(f"REVIEW PIPELINE COMPLETE ({elapsed:.0f}s)")
    print(f"{'='*60}")
    print(f"  Phase 1: {len(succeeded)} platform reviews (parallel, 5 workers each)")
    print(f"  Phase 2: Meta-review (5 workers + arbiter)")
    print(f"  Phase 3: Meta-meta-review (5 workers + arbiter)")
    total_files = sum(r.get("files", 0) for r in reviews)
    print(f"  Total files reviewed: {total_files}")
    print(f"\n  Results saved to:")
    print(f"    review-all.json")
    print(f"    meta-review-all.json")
    print(f"    meta-meta-review-all.json")

    # Print key findings
    print(f"\n{'='*60}")
    print(f"META-REVIEW SUMMARY")
    print(f"{'='*60}")
    print(meta.content[:3000])

    print(f"\n{'='*60}")
    print(f"META-META-REVIEW SUMMARY")
    print(f"{'='*60}")
    print(mm.content[:3000])


if __name__ == "__main__":
    asyncio.run(main())
