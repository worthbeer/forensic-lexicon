# forensic-lexicon

A personal reference of named patterns for recurring failure modes and situations in AI-assisted development — the kind of thing that's easy to recognize in the moment but hard to name precisely enough to discuss.

## What this is

Each entry names a specific, recurring pattern (`false-termination`, `scope-bleed`, `self-sealed-bubble`, etc.) in one dense paragraph — not a textbook definition, more a pattern-recognition tool for spotting the thing while it's happening. Patterns are portable: most apply beyond code, to architecture, process, or any collaborative work.

`forensic-lexicon-v7.md` is the current state after several rounds of refinement — the "v7" marks iteration count, not a formal release series.

## lexicon-manager.jsx

A small standalone React tool for adding entries: paste in a raw description of a pattern, Claude formats it to match the lexicon's established style, and it commits the result straight to `forensic-lexicon-v7.md` via the GitHub Contents API.

It's a personal/local tool, not a hosted app — it takes an Anthropic API key and a GitHub token as page input, held only in memory for the session, never persisted or sent anywhere but Anthropic's and GitHub's APIs directly. Not meant to be deployed publicly with real credentials typed into it.

## Status

Not under active development — this was a working reference for a specific period, kept here as-is rather than continued.
