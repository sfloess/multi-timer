#!/usr/bin/env python3
"""FreeModelRouter arbiter/workers consensus helper.

Uses FreeModelRouter's built-in consensus_chat() which:
1. Selects N diverse workers across different providers
2. Fans out the prompt to all workers concurrently
3. Picks an arbiter model from a different provider
4. Arbiter synthesizes worker responses into consensus

Worker counts by task type:
  - generate: 5 workers (diverse code generation)
  - review:   5 workers (catch more issues)
  - design:   5 workers (diverse architecture perspectives)
  - quick:    3 workers (fast checks, single-file reviews)

Usage:
    from tools.fmr_consensus import FMRConsensus

    fmr = FMRConsensus()
    await fmr.init()

    # Code generation (5 workers + arbiter)
    code = await fmr.generate("Write a TimerViewModel in Kotlin...")

    # Code review (5 workers + arbiter)
    review = await fmr.review(code_content, lang="kotlin")

    # Design (5 workers + arbiter)
    design = await fmr.design("Design a multi-timer Android app...")

    # Quick check (3 workers + arbiter)
    result = await fmr.quick("Is this Kotlin code correct? ...")
"""

import asyncio
import os
import sys
import time
from dataclasses import dataclass

sys.path.insert(0, os.path.expanduser("~/Development/github/FlossWare/loom-ai"))

from loom_ai.backends.free_model_router import FreeModelRouter
from loom_ai.models import ChatMessage


@dataclass
class ConsensusResponse:
    content: str
    model: str
    provider: str
    n_workers: int
    elapsed_seconds: float


# Content-safety model detection
_SAFETY_PREFIXES = ("User Safety:", "Content Safety:", "I cannot", "I'm unable")


def _is_garbage(text: str) -> bool:
    if not text or len(text.strip()) < 30:
        return True
    first_line = text.strip().split("\n")[0]
    return any(first_line.startswith(p) for p in _SAFETY_PREFIXES)


class FMRConsensus:
    """FreeModelRouter with explicit arbiter/workers consensus."""

    def __init__(self, n_workers_default: int = 5):
        self._n_workers_default = n_workers_default
        self._routers: dict[int, FreeModelRouter] = {}
        self._initialized = False

    async def init(self):
        """Initialize router pool. Call once before using."""
        if self._initialized:
            return
        for n in (3, 5):
            r = FreeModelRouter(consensus=True, n_workers=n)
            await r.initialize()
            self._routers[n] = r
        model_count = len(await self._routers[3].list_models())
        print(f"FMR initialized: {model_count} models, arbiter/workers consensus enabled")
        self._initialized = True

    def _router(self, n_workers: int) -> FreeModelRouter:
        if n_workers not in self._routers:
            raise ValueError(f"No router for n_workers={n_workers}. Available: {list(self._routers.keys())}")
        return self._routers[n_workers]

    async def _consensus_call(
        self,
        system: str,
        user: str,
        n_workers: int,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        retries: int = 2,
    ) -> ConsensusResponse:
        """Core consensus call using FMR's built-in arbiter/workers.

        Does NOT pass model= so FMR routes through consensus_chat():
        - Workers: N diverse models fan out concurrently
        - Arbiter: separate model synthesizes consensus
        """
        router = self._router(n_workers)
        messages = [
            ChatMessage(role="system", content=system),
            ChatMessage(role="user", content=user),
        ]

        for attempt in range(retries + 1):
            t0 = time.monotonic()
            try:
                resp = await asyncio.wait_for(
                    router.chat(
                        messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    ),
                    timeout=180,
                )
                elapsed = time.monotonic() - t0

                if _is_garbage(resp.content):
                    print(f"  [RETRY {attempt+1}] Garbage response from {resp.model}, retrying...")
                    continue

                print(f"  [CONSENSUS] {n_workers} workers + arbiter -> {resp.provider}/{resp.model} ({len(resp.content)} chars, {elapsed:.1f}s)")
                return ConsensusResponse(
                    content=resp.content,
                    model=resp.model,
                    provider=resp.provider,
                    n_workers=n_workers,
                    elapsed_seconds=elapsed,
                )
            except asyncio.TimeoutError:
                print(f"  [TIMEOUT] Attempt {attempt+1} timed out after 180s")
            except Exception as e:
                print(f"  [ERROR] Attempt {attempt+1}: {e}")
                if attempt < retries:
                    await asyncio.sleep(2)

        raise RuntimeError(f"Consensus failed after {retries+1} attempts")

    async def generate(self, prompt: str, **kwargs) -> ConsensusResponse:
        """Code generation with 5-worker consensus."""
        return await self._consensus_call(
            system=(
                "You are an expert software engineer. Provide complete, "
                "production-ready code. Include proper error handling, "
                "imports, and type annotations. Output ONLY the code — "
                "no markdown fences, no explanation."
            ),
            user=prompt,
            n_workers=kwargs.pop("n_workers", 5),
            temperature=kwargs.pop("temperature", 0.7),
            **kwargs,
        )

    async def review(self, code: str, lang: str = "kotlin", **kwargs) -> ConsensusResponse:
        """Code review with 5-worker consensus."""
        return await self._consensus_call(
            system=(
                "You are an expert code reviewer. Review for compilation "
                "errors, bugs, security issues, and performance problems. "
                "Be specific: quote line numbers, suggest concrete fixes, "
                "and rate severity (CRITICAL/HIGH/MEDIUM/LOW)."
            ),
            user=f"Review this {lang} code for issues:\n\n```{lang}\n{code}\n```",
            n_workers=kwargs.pop("n_workers", 5),
            temperature=kwargs.pop("temperature", 0.3),
            **kwargs,
        )

    async def design(self, prompt: str, **kwargs) -> ConsensusResponse:
        """Architecture/design with 5-worker consensus."""
        return await self._consensus_call(
            system=(
                "You are a senior software architect. Analyze the design "
                "question and provide a thorough, opinionated recommendation. "
                "Be specific about trade-offs, suggest concrete patterns, "
                "and justify your choices."
            ),
            user=prompt,
            n_workers=kwargs.pop("n_workers", 5),
            temperature=kwargs.pop("temperature", 0.7),
            **kwargs,
        )

    async def quick(self, prompt: str, **kwargs) -> ConsensusResponse:
        """Quick check with 3-worker consensus."""
        return await self._consensus_call(
            system="You are an expert software engineer. Be concise and precise.",
            user=prompt,
            n_workers=kwargs.pop("n_workers", 3),
            temperature=kwargs.pop("temperature", 0.3),
            **kwargs,
        )

    async def review_file(self, filepath: str, **kwargs) -> ConsensusResponse:
        """Review a single file by path."""
        with open(filepath) as f:
            code = f.read()
        ext = os.path.splitext(filepath)[1]
        lang_map = {
            ".kt": "kotlin", ".java": "java", ".py": "python",
            ".cs": "csharp", ".swift": "swift", ".ts": "typescript",
            ".tsx": "typescript", ".js": "javascript", ".xml": "xml",
        }
        lang = lang_map.get(ext, "code")
        return await self.review(code, lang=lang, **kwargs)

    async def review_files(self, filepaths: list[str], **kwargs) -> list[tuple[str, ConsensusResponse]]:
        """Review multiple files sequentially."""
        results = []
        for fp in filepaths:
            name = os.path.basename(fp)
            print(f"\n--- Reviewing {name} ---")
            try:
                resp = await self.review_file(fp, **kwargs)
                results.append((fp, resp))
            except Exception as e:
                print(f"  [FAILED] {name}: {e}")
        return results
