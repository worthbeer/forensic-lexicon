# Forensic Lexicon v7
*A pattern reference for LLM-assisted development failure modes.*
*Patterns are portable — applicable to code, architecture, process, and any collaborative context.*

---

## Core Concept: The Artifact vs. The Intention

The central failure mode in LLM-assisted development: the artifact (the code, the output, the answer) becomes decoupled from the intention that should have shaped it. The artifact looks correct. The intention was never fully formed, or was lost in transit.

---

## Entries

### `assumption-risk`
The hazard introduced when load-bearing assumptions between collaborating parties remain unnamed and unsynchronized. Begins at the first exchange, not at the code. Two watches in the room, nobody knows what time it is. Two freewheeling interpretations, untethered. Managed assumption is velocity; assumption-risk is the unexamined kind that structures everything downstream.

---

### `resolution-recognition`
The internal signal that genuine understanding of a problem has been achieved. Not surface acknowledgment — the click. Accepting AI output or approving a PR before this fires produces artifacts that are decoupled from real intention. Speed is the primary suppressor.

---

### `review-as-record`
The principle that a code review comment is not conversational — it is an auditable record of what was observed, what risk was identified, and what action was prescribed. Comments that fail this standard leave no traceable chain of reasoning for future engineers or AI systems inheriting the codebase.

---

### `llm-hallucinated-safety`
When an LLM generates code that appears safe, tested, or validated — but the safety signals are themselves generated, not real. The output contains the *language* of correctness without the substance. Dangerous because it passes casual review.

---

### `lost-scar-tissue`
Institutional knowledge — hard-won decisions, failure-derived constraints, edge cases learned in production — that exists only in the memory of engineers, not in documentation or code. When those engineers leave, or when AI is handed the codebase without that context, the scar tissue is gone. The system re-injures itself.

---

### `source:llm-generated`
A tagging discipline: code, comments, documentation, or decisions that originated from an LLM output should be marked as such at the point of entry. Absence of this marker erases provenance. Future reviewers — human or AI — cannot distinguish generated artifacts from authored ones.

---

### `premature-resolution`
Accepting AI output before the engineer has achieved genuine recognition of the problem space. The output arrives before the click fires. The artifact substitutes for the intention rather than expressing it.

---

### `context-starvation`
Prompting an LLM without supplying the architectural constraints, coding standards, security requirements, or business rules that govern the system. The model is capable but uninformed — a skilled contractor handed a napkin sketch instead of blueprints.

---

### `invisible-constraint`
A system rule, architectural decision, or business requirement that is known to the team but never encoded — not in documentation, not in tests, not in linting rules. Invisible to new hires. Invisible to AI. Violation is predictable and blameless.

---

### `confidence-fluency conflation`
Mistaking the fluency and confidence of LLM output for correctness. The model writes with authority regardless of accuracy. The signal that would normally indicate "this person knows what they're talking about" is always present, always calibrated to sound right.

---

### `scope-bleed`
When an AI-assisted change exceeds the defined scope of the task — refactoring adjacent code, altering patterns outside the target area, making decisions the engineer didn't authorize. The output is larger than the intention.

---

### `prompt-as-spec`
Treating a prompt as a sufficient specification for production code. The prompt captures what the engineer thought to say, not the full system context that should govern the output. What the engineer didn't say becomes what the AI decides.

---

### `ownership-diffusion`
The gradual erosion of clear authorship and accountability when AI generates significant portions of a codebase. No one wrote it, so no one fully owns it. Review becomes performance. Accountability becomes diffuse.

---

### `pattern-override`
When an LLM substitutes a generic or common pattern for the project-specific pattern that governs this codebase — because the project-specific pattern was not supplied as context. The output is correct in the general case and wrong in this one.

---

### `iterative-drift`
Accumulated deviation from original intent across multiple AI-assisted iterations. Each step looks like a small adjustment. The aggregate is an artifact that no longer reflects the original intention and cannot be traced back to it.

---

### `test-as-theater`
When tests are generated alongside code by the same LLM call — testing the code's own assumptions rather than validating against real requirements. The tests pass. The behavior is wrong. The test suite provides false safety.

---

### `observability-blind-spot`
When a change is reviewed and approved without verifying that a production failure caused by that code would be diagnosable from existing logs and metrics. The code may be functionally correct under test conditions and still leave on-call engineers blind at 2AM. The review gate question: *if this fails in production, would anyone know why?* Distinct from `test-as-theater` — tests may pass; the failure mode is in what gets recorded after deployment, not what gets checked before it.

---

### `documentation-lag`
The gap between what the system does and what the documentation says it does — widened when AI accelerates code changes without corresponding documentation updates. Future engineers and AI systems inherit the gap.

---

### `cascade-assumption`
When one unverified assumption is used as the foundation for subsequent decisions, each building on the last. By the time the base assumption is questioned, the structure above it is extensive. Common in multi-turn AI sessions where early framing is never challenged.

---

### `lexicon-velocity`
When Lexicon terms are deployed faster than the reader can achieve genuine recognition on each one — producing the appearance of shared understanding without the substance. The Lexicon becomes the hazard it was built to name. Every entry is also a test of whether you are reading with recognition or just reading.

---

### `definition-recognition`
The requirement that a Lexicon term not be *used* until the reader has achieved genuine internalization of what it encodes. Not read. Not nodded. Clicked. Parallel to `resolution-recognition` — applies to language the way resolution-recognition applies to code.

---

### `self-sealed-bubble`
The condition in which a process, tool, or artifact is evaluated only within the system that produced it — never against external, uncontrolled feedback. Feels sharp from the inside. The bubble provides no signal about how it lands in the real world. Recruiter warmth is not external calibration. A closed room is not a test. The only corrective is a target that shoots back.

---

### `pre-launch-drift`
The gap between what an artifact was intended to communicate and what it actually communicates to a cold reader — widened when the author reviews their own work without a structured edit pass. Distinct from `iterative-drift`: this is not accumulated deviation across iterations, it is the unexamined distance between author intent and reader experience at the moment of send. Closed by a deliberate edit round against explicit criteria before launch.

---

### `disqualifier-surfacing`
The pattern of naming one's own gaps or weaknesses inside an outbound artifact before the reader finds them — framed as honesty, functioning as self-elimination. Transparency has a place; the application is not that place. A gap named in your cover letter becomes the first thing they see. What you demonstrate closes gaps. What you confess opens them.

---

### `false-termination`
When an agent loop exits because the model reported completion — not because completion was verified. The model is the worst possible judge of its own output: it has no access to ground truth, no ability to run tests, and a strong generative bias toward closure. A loop that ends on a model's say-so has no brake. Done should mean the tests pass, not the model saying it's done. See also: `loop-critic-absence`.

---

### `context-rot`
The accumulation of stale, redundant, or misleading content in an agent's context window across loop iterations — degrading decision quality with each turn. Old tool outputs, abandoned reasoning threads, and superseded results stay in context by default. The longer the loop runs, the worse the inputs to each subsequent model call. Context rot turns a capable model into a confused one without any single visible failure. Managed by compaction, offloading, and sub-agent isolation.

---

### `doom-loop`
The self-reinforcing spiral in which context rot produces worse model decisions, which generate noisier outputs, which further rot the context. No single step looks catastrophic; the failure is in the trajectory. An agent in a doom loop gets less useful the longer it runs — the opposite of what longer effort should produce. Breaking the loop requires an external intervention: a hard cap, a context reset, or a sub-agent handoff.

---

### `loop-critic-absence`
The condition in which the only evaluator of an agent's output is the agent itself. A model asked to grade its own work will usually pass it — not from dishonesty, but because the generative process that produced the output also shapes the evaluation of it. Sound loop architecture separates the maker from the checker: a hard signal (failing test, type error, schema violation) or a second model running under independent instructions. Without a critic outside the loop, "done" is just the model agreeing with itself.

---

### `tool-selection-collapse`
The failure mode in which an agent is given too many overlapping tools and loses reliable judgment about which to call. Tool count is not capability — it is cognitive load on the model's selection process. Past a threshold, adding tools raises ambiguity faster than it raises coverage. A focused, non-overlapping toolset with unambiguous selection criteria outperforms a large one. Vercel's documented finding: cutting available tools raised agent success rate.

---

### `non-idempotent-write`
A tool action that is not safe to repeat — where a retry of the same call produces a different or compounding side effect. In a loop, retries are not exceptional; they are the recovery mechanism. A tool that creates a duplicate customer record, sends a second email, or charges a card twice on retry is structurally incompatible with loop-based execution. Every write in an agent harness must either be idempotent by design or guarded by a deduplication check before the loop can be trusted to recover from failure.

---

*v7 — June 27, 2026*
*30 entries*
