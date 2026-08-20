#!/usr/bin/env python3
"""Multi-model consensus tool using FreeModelRouter.

All design, coding, review, and meta-review is done by FREE models.
Claude is the orchestrator only - free models do all creative work.

Usage:
    python3 consensus.py design                # Design consensus
    python3 consensus.py build                 # Generate code from design
    python3 consensus.py review [path]         # Code review consensus
    python3 consensus.py meta                  # Meta-review
    python3 consensus.py fix                   # Generate fixes from review
    python3 consensus.py full                  # Run entire pipeline
"""

import asyncio
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.expanduser(
    "~/Development/github/FlossWare/loom-ai"
))
os.environ.setdefault(
    "LOOM_SECRETS_API", "http://cabin-laptop-02:5000/secrets"
)

from loom_ai.backends.free_model_router import FreeModelRouter
from loom_ai.models import ChatMessage

PREFERRED_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
]

MAX_MODELS = 3
QUERY_TIMEOUT = 90
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "../multi-timer-dev")


async def query_model(router, model_hint, prompt, system="", max_tokens=4096):
    """Query a specific model via the router with timeout."""
    messages = []
    if system:
        messages.append(ChatMessage(role="system", content=system))
    messages.append(ChatMessage(role="user", content=prompt))
    try:
        resp = await asyncio.wait_for(
            router.chat(
                messages, model=model_hint, temperature=0.7, max_tokens=max_tokens
            ),
            timeout=QUERY_TIMEOUT,
        )
        print(f"  [OK] {model_hint} -> {resp.provider}/{resp.model} ({len(resp.content)} chars)")
        return {
            "model": resp.model,
            "provider": resp.provider,
            "content": resp.content,
        }
    except asyncio.TimeoutError:
        print(f"  [TIMEOUT] {model_hint} after {QUERY_TIMEOUT}s")
        return {"model": model_hint, "provider": "error", "content": "timeout"}
    except Exception as e:
        print(f"  [ERROR] {model_hint}: {e}")
        return {"model": model_hint, "provider": "error", "content": str(e)}


async def multi_model_consensus(router, prompt, system="", n_models=MAX_MODELS,
                                 max_tokens=4096):
    """Query multiple models and synthesize consensus."""
    models = await router.list_models()
    selected = []
    for pref in PREFERRED_MODELS:
        for m in models:
            if pref in m and m not in selected:
                selected.append(m)
                break
        if len(selected) >= n_models:
            break

    if len(selected) < n_models:
        for m in models:
            if m not in selected:
                selected.append(m)
            if len(selected) >= n_models:
                break

    print(f"\n--- Querying {len(selected)} models ---")
    for m in selected:
        print(f"  - {m}")

    tasks = [query_model(router, m, prompt, system, max_tokens) for m in selected]
    results = await asyncio.gather(*tasks)

    valid = [r for r in results if r["provider"] != "error"]
    print(f"\n--- Got {len(valid)}/{len(results)} valid responses ---")

    for r in valid:
        print(f"\n=== {r['provider']}/{r['model']} ===")
        preview = r["content"][:300]
        print(preview)
        if len(r["content"]) > 300:
            print(f"... ({len(r['content'])} chars total)")

    if len(valid) >= 2:
        synth_prompt = "You are synthesizing responses from multiple AI models.\n\n"
        for i, r in enumerate(valid):
            synth_prompt += f"--- Model {i+1} ({r['provider']}/{r['model']}) ---\n"
            synth_prompt += r["content"] + "\n\n"
        synth_prompt += (
            "Synthesize these responses into a single coherent, complete output. "
            "Combine the best elements from each. "
            "If they produced code, produce the FINAL merged code. "
            "Note areas of agreement and disagreement."
        )

        print("  [SYNTH] Running synthesis...")
        try:
            synth = await asyncio.wait_for(
                router.chat(
                    [ChatMessage(role="user", content=synth_prompt)],
                    temperature=0.3,
                    max_tokens=max_tokens,
                ),
                timeout=QUERY_TIMEOUT,
            )
            print(f"  [SYNTH] Done via {synth.provider}/{synth.model}")
            return {
                "individual": valid,
                "consensus": synth.content,
                "synthesis_model": f"{synth.provider}/{synth.model}",
            }
        except asyncio.TimeoutError:
            print("  [SYNTH] Timed out, using best individual response")
            best = max(valid, key=lambda r: len(r["content"]))
            return {
                "individual": valid,
                "consensus": best["content"],
                "synthesis_model": f"fallback/{best['model']}",
            }

    return {"individual": valid, "consensus": valid[0]["content"] if valid else ""}


def extract_code_blocks(text):
    """Extract filename->code pairs from markdown code blocks.

    Looks for patterns like:
      ```tsx  // filename: src/components/Foo.tsx
      or
      **src/components/Foo.tsx**
      ```tsx
      or
      ### src/components/Foo.tsx
      ```
    """
    files = {}

    # Pattern 1: ```lang // filename: path
    pattern1 = re.findall(
        r'```\w*\s*(?://|#|<!--)\s*(?:filename|file|path):\s*(\S+)\s*(?:-->)?\n(.*?)```',
        text, re.DOTALL | re.IGNORECASE
    )
    for path, code in pattern1:
        files[path.strip()] = code.strip()

    # Pattern 2: header then code block
    # Matches: **path** or ### path or `path` followed by ```
    pattern2 = re.findall(
        r'(?:\*\*|###?\s*|`)([\w/.@-]+\.(?:tsx?|json|css|js))\s*(?:\*\*|`)?'
        r'\s*\n```\w*\n(.*?)```',
        text, re.DOTALL
    )
    for path, code in pattern2:
        if path not in files:
            files[path.strip()] = code.strip()

    return files


def write_generated_files(files, base_dir):
    """Write extracted code files to disk."""
    written = []
    for path, content in files.items():
        full_path = os.path.join(base_dir, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w") as f:
            f.write(content + "\n")
        written.append(path)
        print(f"  [WROTE] {path} ({len(content)} chars)")
    return written


# ---- PHASES ----

async def run_design(router):
    """Design phase: get multi-model consensus on app architecture."""
    prompt = """Design a cross-platform multi-timer application for Android, iOS, and Windows.

Requirements (from reference image of existing Windows app "NxCore Multi Timer"):
1. Multiple timer panes - each is an independent timer
2. Each pane has:
   - Event Name text field (editable)
   - Digital clock display (HH:MM:SS format, large)
   - Start button, Reset button
   - Time picker/selector (dropdown or spinner for setting duration)
   - A "..." or menu button for adding notes to this timer
3. Control buttons in a toolbar:
   - Add new timer pane (+)
   - Delete selected timer pane (trash icon)
   - Move timer up/down (reorder)
   - Stop/close button
4. Alert/notification when timer reaches zero
5. Notes associated with each timer (shown via ... button)

Technology: Must use Expo/React Native (supports Android/iOS/web-for-Windows)
Constraints: FREE tools only, no paid APIs or services

Please provide:
1. Component architecture (React components hierarchy)
2. State management approach
3. Data model (TypeScript interfaces)
4. Key libraries needed (all free)
5. UI layout recommendations
6. Platform-specific considerations (notifications on each platform)

Be specific and practical - this will be directly implemented."""

    system = (
        "You are a senior cross-platform mobile architect. "
        "Give concrete, implementable designs."
    )

    result = await multi_model_consensus(router, prompt, system)

    with open("design-consensus.json", "w") as f:
        json.dump(result, f, indent=2)

    print("\n" + "=" * 60)
    print("CONSENSUS DESIGN")
    print("=" * 60)
    print(result["consensus"])
    print(f"\n[Synthesized by {result.get('synthesis_model', 'N/A')}]")
    return result


async def run_build(router, design=None):
    """Build phase: free models generate all the code."""
    if design is None:
        try:
            with open("design-consensus.json") as f:
                design = json.load(f)
        except FileNotFoundError:
            print("No design-consensus.json found. Running design first...")
            design = await run_design(router)

    # We need to generate files one at a time or in groups due to token limits.
    # First, ask a model to produce the file list from the design.
    file_list_prompt = f"""Based on this design for an Expo/React Native multi-timer app:

{design['consensus'][:6000]}

List ALL files that need to be created, with their exact paths relative to the project root.
The project uses Expo with TypeScript. Include:
- Type definitions
- Context/state management
- All UI components
- Main App.tsx
- app.json config

Output as a JSON array of objects: [{{"path": "src/types/timer.ts", "description": "Timer data model"}}]
Output ONLY the JSON array, no other text."""

    file_list_result = await query_model(
        router, "gemini-2.5-flash", file_list_prompt,
        system="You are a code generator. Output only what is asked, no commentary.",
        max_tokens=2048
    )

    # Parse the file list
    try:
        raw = file_list_result["content"]
        # Extract JSON array from response
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            file_list = json.loads(match.group())
        else:
            file_list = json.loads(raw)
    except (json.JSONDecodeError, AttributeError):
        print("[WARN] Could not parse file list, using default structure")
        file_list = [
            {"path": "src/types/timer.ts", "description": "Timer TypeScript interfaces"},
            {"path": "src/context/TimerContext.tsx", "description": "Timer state management with Context + useReducer"},
            {"path": "src/components/TimerDisplay.tsx", "description": "Digital clock display component"},
            {"path": "src/components/TimerPane.tsx", "description": "Individual timer pane with controls"},
            {"path": "src/components/TimePickerModal.tsx", "description": "Modal for setting timer duration"},
            {"path": "src/components/NotesModal.tsx", "description": "Modal for editing timer notes"},
            {"path": "src/components/Toolbar.tsx", "description": "Top toolbar with add/delete/reorder/stop controls"},
            {"path": "App.tsx", "description": "Main app entry point"},
        ]

    print(f"\n--- File plan ({len(file_list)} files) ---")
    for f in file_list:
        print(f"  - {f['path']}: {f.get('description', '')}")

    all_generated = {}

    # Generate code for each file using multiple models for consensus
    for file_info in file_list:
        path = file_info["path"]
        desc = file_info.get("description", path)
        print(f"\n{'='*60}")
        print(f"GENERATING: {path}")
        print(f"{'='*60}")

        # Build context: include already-generated files so models see dependencies
        context_block = ""
        for prev_path, prev_code in all_generated.items():
            context_block += f"\n--- {prev_path} ---\n{prev_code}\n"

        gen_prompt = f"""You are generating code for a cross-platform multi-timer app using Expo/React Native with TypeScript.

DESIGN SPEC:
{design['consensus'][:4000]}

ALREADY GENERATED FILES:
{context_block if context_block else "(none yet - this is the first file)"}

NOW GENERATE: {path}
Description: {desc}

Requirements:
- Use Expo SDK (expo-notifications for alerts, @react-native-async-storage/async-storage for persistence)
- Use react-native-safe-area-context
- TypeScript with proper types
- Clean, production-quality code
- Must work on Android, iOS, and Web
- Use Platform.select() for platform-specific styling

Output ONLY the complete file content. No markdown fences, no explanation, no commentary.
Start directly with the import statements (or export for types)."""

        system = (
            "You are an expert React Native/Expo developer. "
            "Output ONLY the requested code file. No markdown, no commentary. "
            "Start with imports. End with the last line of code."
        )

        result = await multi_model_consensus(
            router, gen_prompt, system, n_models=3, max_tokens=4096
        )

        code = result["consensus"]
        # Strip any markdown fences the model might have added anyway
        code = re.sub(r'^```\w*\n', '', code)
        code = re.sub(r'\n```\s*$', '', code)
        # Strip leading/trailing commentary if model added any
        lines = code.split('\n')
        start = 0
        for i, line in enumerate(lines):
            if line.strip().startswith(('import ', 'export ', 'from ', '//', '/*', 'const ', 'interface ', 'type ', 'enum ')):
                start = i
                break
        code = '\n'.join(lines[start:])

        all_generated[path] = code
        print(f"  Generated {len(code)} chars")

    # Write all files
    print(f"\n{'='*60}")
    print(f"WRITING {len(all_generated)} FILES TO {OUTPUT_DIR}")
    print(f"{'='*60}")
    written = write_generated_files(all_generated, OUTPUT_DIR)

    # Save build manifest
    with open("build-manifest.json", "w") as f:
        json.dump({
            "files": written,
            "design_model": design.get("synthesis_model", "unknown"),
            "output_dir": OUTPUT_DIR,
        }, f, indent=2)

    print(f"\n[BUILD COMPLETE] {len(written)} files written")
    return all_generated


async def run_review(router, code_path=None):
    """Review phase: multi-model code review."""
    if code_path is None:
        code_path = OUTPUT_DIR

    files = {}
    for ext in ("**/*.tsx", "**/*.ts"):
        for f in glob.glob(os.path.join(code_path, ext), recursive=True):
            if "node_modules" not in f:
                with open(f) as fh:
                    content = fh.read()
                    if content.strip():
                        rel = os.path.relpath(f, code_path)
                        files[rel] = content

    if not files:
        print("[ERROR] No source files found to review")
        return None

    code_block = ""
    for path, content in files.items():
        code_block += f"\n--- {path} ---\n{content}\n"

    print(f"\n--- Reviewing {len(files)} files ({len(code_block)} chars) ---")

    prompt = f"""Review this Expo/React Native multi-timer application code.

{code_block}

Review for:
1. Correctness - bugs, logic errors, race conditions in timer logic
2. Cross-platform compatibility - Android/iOS/Web differences
3. UX issues - missing features from requirements, poor ergonomics
4. Performance - unnecessary re-renders, memory leaks, interval cleanup
5. Missing features:
   - Multiple timer panes with editable names
   - Start/Pause/Reset per pane
   - Time picker to set duration
   - Notes via "..." button per pane
   - Add/Delete/Reorder timer panes via toolbar
   - Alerts/notifications when timer completes
   - Data persistence (AsyncStorage)

For each issue found, provide:
- Severity: CRITICAL / MAJOR / MINOR
- File and location
- What's wrong
- Specific fix (code if possible)

Be thorough and specific. This is a production code review."""

    system = "You are a senior React Native code reviewer. Be thorough, specific, and actionable."

    result = await multi_model_consensus(router, prompt, system, max_tokens=4096)

    with open("review-consensus.json", "w") as f:
        json.dump(result, f, indent=2)

    print("\n" + "=" * 60)
    print("REVIEW CONSENSUS")
    print("=" * 60)
    print(result["consensus"])
    return result


async def run_meta_review(router):
    """Meta-review: review the reviews, then generate fixes."""
    try:
        with open("review-consensus.json") as f:
            review = json.load(f)
    except FileNotFoundError:
        print("No review-consensus.json found. Run review first.")
        return None

    prompt = f"""You are performing a meta-review of code reviews for a multi-timer app.

Individual reviews from multiple AI models:
{json.dumps(review['individual'], indent=2)[:8000]}

Synthesized consensus review:
{review['consensus'][:4000]}

Meta-review tasks:
1. Which findings are CONFIRMED across multiple reviewers? (highest confidence)
2. Which findings are DISPUTED (only one reviewer flagged)?
3. Any FALSE POSITIVES (non-issues)?
4. What did ALL reviewers MISS?
5. PRIORITIZED action list - what to fix first?

Output a JSON object:
{{
  "confirmed": [{{"severity": "CRITICAL|MAJOR|MINOR", "file": "path", "issue": "description", "fix": "what to do"}}],
  "disputed": [...],
  "false_positives": [...],
  "missing": [...],
  "priority_order": ["issue1", "issue2", ...]
}}

Be critical and analytical. Only high-confidence findings should drive changes."""

    system = "You are a principal engineer performing meta-review. Output structured JSON."

    result = await multi_model_consensus(router, prompt, system, max_tokens=4096)

    with open("meta-review-consensus.json", "w") as f:
        json.dump(result, f, indent=2)

    print("\n" + "=" * 60)
    print("META-REVIEW CONSENSUS")
    print("=" * 60)
    print(result["consensus"])
    return result


async def run_fix(router):
    """Fix phase: generate code fixes based on meta-review findings."""
    try:
        with open("meta-review-consensus.json") as f:
            meta = json.load(f)
    except FileNotFoundError:
        print("No meta-review-consensus.json found. Run meta first.")
        return None

    # Read current source files
    files = {}
    for ext in ("**/*.tsx", "**/*.ts"):
        for f in glob.glob(os.path.join(OUTPUT_DIR, ext), recursive=True):
            if "node_modules" not in f:
                with open(f) as fh:
                    content = fh.read()
                    if content.strip():
                        rel = os.path.relpath(f, OUTPUT_DIR)
                        files[rel] = content

    code_block = ""
    for path, content in files.items():
        code_block += f"\n--- {path} ---\n{content}\n"

    prompt = f"""Apply fixes to this Expo/React Native multi-timer app based on code review findings.

CURRENT CODE:
{code_block}

META-REVIEW FINDINGS:
{meta['consensus'][:6000]}

For each file that needs changes, output the COMPLETE updated file.
Format each file as:

**path/to/file.tsx**
```tsx
// complete file content here
```

Only output files that actually need changes. Include the FULL file content (not just diffs).
Apply ALL confirmed fixes. Do NOT introduce new issues."""

    system = (
        "You are an expert React Native developer applying code review fixes. "
        "Output complete file contents for every file that needs changes."
    )

    result = await multi_model_consensus(
        router, prompt, system, n_models=3, max_tokens=4096
    )

    # Extract and write fixed files
    fixed_files = extract_code_blocks(result["consensus"])

    if fixed_files:
        print(f"\n--- Applying {len(fixed_files)} file fixes ---")
        write_generated_files(fixed_files, OUTPUT_DIR)
    else:
        print("\n[WARN] No code blocks extracted from fix response")
        print("Raw consensus saved to fix-consensus.json for manual review")

    with open("fix-consensus.json", "w") as f:
        json.dump(result, f, indent=2)

    return result


async def run_full():
    """Run the complete pipeline: design -> build -> review -> meta -> fix."""
    router = FreeModelRouter()
    await router.initialize()
    model_count = len(await router.list_models())
    print(f"Router initialized with {model_count} models")
    print(f"Output directory: {OUTPUT_DIR}")

    print("\n" + "#" * 60)
    print("# PHASE 1: DESIGN CONSENSUS")
    print("#" * 60)
    design = await run_design(router)

    print("\n" + "#" * 60)
    print("# PHASE 2: CODE GENERATION")
    print("#" * 60)
    await run_build(router, design)

    print("\n" + "#" * 60)
    print("# PHASE 3: CODE REVIEW")
    print("#" * 60)
    await run_review(router)

    print("\n" + "#" * 60)
    print("# PHASE 4: META-REVIEW")
    print("#" * 60)
    await run_meta_review(router)

    print("\n" + "#" * 60)
    print("# PHASE 5: APPLY FIXES")
    print("#" * 60)
    await run_fix(router)

    print("\n" + "#" * 60)
    print("# PHASE 6: FINAL REVIEW (verification)")
    print("#" * 60)
    await run_review(router)

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)
    print(f"Output: {OUTPUT_DIR}")
    print("Run 'npx expo start --web' in output dir to test")


async def main():
    phase = sys.argv[1] if len(sys.argv) > 1 else "full"

    if phase == "full":
        await run_full()
        return

    router = FreeModelRouter()
    await router.initialize()
    print(f"Router initialized with {len(await router.list_models())} models")

    if phase == "design":
        await run_design(router)
    elif phase == "build":
        await run_build(router)
    elif phase == "review":
        code_path = sys.argv[2] if len(sys.argv) > 2 else None
        await run_review(router, code_path)
    elif phase == "meta":
        await run_meta_review(router)
    elif phase == "fix":
        await run_fix(router)
    else:
        print(f"Unknown phase: {phase}")
        print("Usage: python3 consensus.py [design|build|review|meta|fix|full]")


if __name__ == "__main__":
    asyncio.run(main())
