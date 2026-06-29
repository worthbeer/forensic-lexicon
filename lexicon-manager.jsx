import { useState, useCallback } from "react";

const REPO_OWNER = "worthbeer";
const REPO_NAME  = "forensic-lexicon";
const FILE_PATH  = "forensic-lexicon-v7.md";
const BRANCH     = "main";

const SYSTEM_PROMPT = `You are the custodian of the Forensic Lexicon — a pattern reference for LLM-assisted development failure modes. Your job is to take a raw concept and format it as a Lexicon entry that matches the established style exactly.

FORMAT RULES:
- Term: lowercase, hyphenated, backtick-wrapped in the header: ### \`term-name\`
- Body: a single dense paragraph. No bullet points, no sub-sections, no labels.
- Style: precise, compressed, slightly forensic in register. Each sentence earns its place.
- Length: 2–5 sentences. Not a textbook definition — a pattern recognition tool.
- End with a contrast or edge: what makes this distinct from adjacent terms, or what the corrective looks like.
- Do NOT use "This is when..." or "This refers to..." — open with the pattern itself.

EXISTING ENTRIES FOR STYLE REFERENCE:
\`false-termination\`: When an agent loop exits because the model reported completion — not because completion was verified. The model is the worst possible judge of its own output: it has no access to ground truth, no ability to run tests, and a strong generative bias toward closure. A loop that ends on a model's say-so has no brake. Done should mean the tests pass, not the model saying it's done. See also: \`loop-critic-absence\`.

\`self-sealed-bubble\`: The condition in which a process, tool, or artifact is evaluated only within the system that produced it — never against external, uncontrolled feedback. Feels sharp from the inside. The bubble provides no signal about how it lands in the real world. Recruiter warmth is not external calibration. A closed room is not a test. The only corrective is a target that shoots back.

\`scope-bleed\`: When an AI-assisted change exceeds the defined scope of the task — refactoring adjacent code, altering patterns outside the target area, making decisions the engineer didn't authorize. The output is larger than the intention.

OUTPUT FORMAT — return ONLY this, no preamble, no explanation:
### \`term-name\`
[single paragraph body]`;

export default function LexiconManager() {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [anthropicKeySaved, setAnthropicKeySaved] = useState(false);
  const [token, setToken] = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [generatedEntry, setGeneratedEntry] = useState("");
  const [termName, setTermName] = useState("");
  const [status, setStatus] = useState(null); // null | 'generating' | 'ready' | 'pushing' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState("");
  const [pushCount, setPushCount] = useState(0);

  const handleSaveAnthropicKey = () => {
    if (anthropicKey.trim().startsWith("sk-ant-")) {
      setAnthropicKeySaved(true);
      setStatus(null);
    } else {
      setErrorMsg("Anthropic key should start with sk-ant-");
      setStatus("error");
    }
  };

  const handleSaveToken = () => {
    if (token.trim().startsWith("ghp_") || token.trim().startsWith("github_pat_")) {
      setTokenSaved(true);
      setStatus(null);
    } else {
      setErrorMsg("Token should start with ghp_ or github_pat_");
      setStatus("error");
    }
  };

  const generateEntry = useCallback(async () => {
    if (!rawInput.trim()) return;
    setStatus("generating");
    setGeneratedEntry("");
    setTermName("");
    setErrorMsg("");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: rawInput.trim() }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";

      // Extract term name from ### `term`
      const termMatch = text.match(/###\s+`([^`]+)`/);
      if (termMatch) setTermName(termMatch[1]);
      setGeneratedEntry(text.trim());
      setStatus("ready");
    } catch (e) {
      setErrorMsg("Claude API error: " + e.message);
      setStatus("error");
    }
  }, [rawInput]);

  const pushToRepo = useCallback(async () => {
    if (!generatedEntry || !tokenSaved) return;
    setStatus("pushing");
    setErrorMsg("");

    try {
      // 1. Fetch current file content + SHA
      const getRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
        }
      );

      if (!getRes.ok) {
        const err = await getRes.json();
        throw new Error(err.message || `GitHub fetch failed: ${getRes.status}`);
      }

      const fileData = await getRes.json();
      const sha = fileData.sha;
      const currentContent = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ""))));

      // 2. Bump version line and entry count
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const countMatch = currentContent.match(/(\d+) entries/);
      const currentCount = countMatch ? parseInt(countMatch[1]) : 30;
      const newCount = currentCount + 1;

      // 3. Insert new entry before the version footer
      const footerPattern = /\n\*v\d+[^*]*\*/;
      const footerMatch = currentContent.match(footerPattern);

      let newContent;
      if (footerMatch) {
        const insertAt = currentContent.lastIndexOf(footerMatch[0]);
        newContent =
          currentContent.slice(0, insertAt) +
          "\n\n" + generatedEntry + "\n\n---" +
          currentContent.slice(insertAt);
      } else {
        newContent = currentContent + "\n\n" + generatedEntry + "\n\n---";
      }

      // Bump count in footer
      newContent = newContent.replace(/\d+ entries/, `${newCount} entries`);
      // Bump date
      newContent = newContent.replace(/\*v(\d+)[^*]*\*/, `*v$1 — ${today}*`);

      // 4. PUT updated file as a commit
      const putRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `add: \`${termName}\` to forensic lexicon`,
            content: btoa(unescape(encodeURIComponent(newContent))),
            sha,
            branch: BRANCH,
          }),
        }
      );

      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || `GitHub commit failed: ${putRes.status}`);
      }

      setPushCount(n => n + 1);
      setStatus("done");
      setRawInput("");
      setGeneratedEntry("");
      setTermName("");
    } catch (e) {
      setErrorMsg(e.message);
      setStatus("error");
    }
  }, [generatedEntry, token, tokenSaved, termName]);

  const reset = () => {
    setGeneratedEntry("");
    setTermName("");
    setRawInput("");
    setStatus(null);
    setErrorMsg("");
  };

  // ─── styles ────────────────────────────────────────────────────────────────
  const s = {
    root: {
      minHeight: "100vh",
      background: "#0d0d0f",
      color: "#e2e0db",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      padding: "24px 20px",
      boxSizing: "border-box",
    },
    header: {
      borderBottom: "1px solid #2a2a2e",
      paddingBottom: "16px",
      marginBottom: "28px",
    },
    title: {
      fontSize: "13px",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "#6b6b72",
      margin: 0,
    },
    subtitle: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#e2e0db",
      margin: "6px 0 0",
      letterSpacing: "-0.02em",
    },
    badge: {
      display: "inline-block",
      fontSize: "11px",
      padding: "2px 8px",
      borderRadius: "3px",
      marginLeft: "10px",
      verticalAlign: "middle",
      fontWeight: 600,
      letterSpacing: "0.06em",
    },
    section: {
      marginBottom: "24px",
    },
    label: {
      fontSize: "11px",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#6b6b72",
      marginBottom: "8px",
      display: "block",
    },
    input: {
      width: "100%",
      background: "#16161a",
      border: "1px solid #2a2a2e",
      borderRadius: "4px",
      color: "#e2e0db",
      fontFamily: "inherit",
      fontSize: "14px",
      padding: "10px 12px",
      boxSizing: "border-box",
      outline: "none",
    },
    textarea: {
      width: "100%",
      background: "#16161a",
      border: "1px solid #2a2a2e",
      borderRadius: "4px",
      color: "#e2e0db",
      fontFamily: "inherit",
      fontSize: "14px",
      padding: "10px 12px",
      boxSizing: "border-box",
      outline: "none",
      resize: "vertical",
      minHeight: "100px",
    },
    tokenRow: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
    },
    btn: (variant = "primary", disabled = false) => ({
      padding: "10px 18px",
      borderRadius: "4px",
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit",
      fontSize: "13px",
      fontWeight: 600,
      letterSpacing: "0.06em",
      opacity: disabled ? 0.4 : 1,
      transition: "opacity 0.15s",
      background:
        variant === "primary" ? "#4f6ef7"
        : variant === "success" ? "#22c55e"
        : variant === "ghost" ? "transparent"
        : "#2a2a2e",
      color:
        variant === "ghost" ? "#6b6b72" : "#fff",
      border: variant === "ghost" ? "1px solid #2a2a2e" : "none",
    }),
    entryBox: {
      background: "#16161a",
      border: "1px solid #2a2a2e",
      borderRadius: "4px",
      padding: "14px",
      fontSize: "13px",
      lineHeight: "1.7",
      color: "#c9c7c2",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    termPill: {
      display: "inline-block",
      background: "#1e2a4a",
      color: "#7aa2f7",
      borderRadius: "3px",
      padding: "2px 8px",
      fontSize: "12px",
      fontWeight: 700,
      marginBottom: "12px",
      letterSpacing: "0.04em",
    },
    actionRow: {
      display: "flex",
      gap: "10px",
      marginTop: "14px",
      flexWrap: "wrap",
    },
    statusBar: (type) => ({
      padding: "10px 14px",
      borderRadius: "4px",
      fontSize: "13px",
      background:
        type === "error" ? "#2a1a1a"
        : type === "done" ? "#1a2a1e"
        : "#1a1e2a",
      border: `1px solid ${
        type === "error" ? "#5a2020"
        : type === "done" ? "#1e5a28"
        : "#2a3060"
      }`,
      color:
        type === "error" ? "#f87171"
        : type === "done" ? "#4ade80"
        : "#93c5fd",
      marginTop: "12px",
    }),
    divider: {
      border: "none",
      borderTop: "1px solid #2a2a2e",
      margin: "24px 0",
    },
    spinner: {
      display: "inline-block",
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      border: "2px solid #4f6ef7",
      borderTopColor: "transparent",
      animation: "spin 0.7s linear infinite",
      marginRight: "8px",
      verticalAlign: "middle",
    },
  };

  return (
    <div style={s.root}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={s.header}>
        <p style={s.title}>Anthropic · Forensic Lexicon</p>
        <h1 style={s.subtitle}>
          Lexicon Manager
          {tokenSaved && (
            <span style={{ ...s.badge, background: "#1a2a1e", color: "#4ade80" }}>
              TOKEN SET
            </span>
          )}
          {pushCount > 0 && (
            <span style={{ ...s.badge, background: "#1e2a4a", color: "#7aa2f7" }}>
              {pushCount} pushed
            </span>
          )}
        </h1>
      </div>

      {/* Anthropic key section */}
      {!anthropicKeySaved ? (
        <div style={s.section}>
          <span style={s.label}>Anthropic API Key</span>
          <div style={s.tokenRow}>
            <input
              style={{ ...s.input, flex: 1 }}
              type="password"
              placeholder="sk-ant-xxxxxxxxxxxxxxxxxxxx"
              value={anthropicKey}
              onChange={e => { setAnthropicKey(e.target.value); setStatus(null); setErrorMsg(""); }}
            />
            <button style={s.btn("primary", !anthropicKey.trim())} onClick={handleSaveAnthropicKey} disabled={!anthropicKey.trim()}>
              Save
            </button>
          </div>
          <p style={{ fontSize: "11px", color: "#6b6b72", marginTop: "6px" }}>
            console.anthropic.com → API keys. Stored in memory, not persisted.
          </p>
        </div>
      ) : (
        <div style={{ ...s.section, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#4ade80" }}>✓ Anthropic key active</span>
          <button style={s.btn("ghost")} onClick={() => { setAnthropicKeySaved(false); setAnthropicKey(""); }}>
            Change
          </button>
        </div>
      )}

      {/* Token section */}
      {!tokenSaved ? (
        <div style={s.section}>
          <span style={s.label}>GitHub Token (contents: write)</span>
          <div style={s.tokenRow}>
            <input
              style={{ ...s.input, flex: 1 }}
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={e => { setToken(e.target.value); setStatus(null); setErrorMsg(""); }}
            />
            <button style={s.btn("primary", !token.trim())} onClick={handleSaveToken} disabled={!token.trim()}>
              Save
            </button>
          </div>
          <p style={{ fontSize: "11px", color: "#6b6b72", marginTop: "6px" }}>
            github.com/settings/tokens → New token → contents: write scope. Stored in memory, not persisted.
          </p>
        </div>
      ) : (
        <div style={{ ...s.section, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#4ade80" }}>✓ GitHub token active · {REPO_OWNER}/{REPO_NAME}</span>
          <button style={s.btn("ghost")} onClick={() => { setTokenSaved(false); setToken(""); }}>
            Change
          </button>
        </div>
      )}

      <hr style={s.divider} />

      {/* Input section */}
      <div style={s.section}>
        <span style={s.label}>Describe the pattern</span>
        <textarea
          style={s.textarea}
          placeholder="Describe the failure mode, concept, or pattern in plain language. A sentence or two is enough — Claude will format it to Lexicon spec."
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          disabled={status === "generating" || status === "pushing"}
        />
        <div style={{ marginTop: "10px" }}>
          <button
            style={s.btn("primary", !rawInput.trim() || !anthropicKeySaved || status === "generating" || status === "pushing")}
            onClick={generateEntry}
            disabled={!rawInput.trim() || !anthropicKeySaved || status === "generating" || status === "pushing"}
          >
            {status === "generating" ? (
              <><span style={s.spinner} />Generating…</>
            ) : "Format Entry"}
          </button>
        </div>
      </div>

      {/* Generated entry */}
      {generatedEntry && (
        <div style={s.section}>
          <span style={s.label}>Generated Entry</span>
          {termName && <div style={s.termPill}>`{termName}`</div>}
          <div style={s.entryBox}>{generatedEntry}</div>
          <div style={s.actionRow}>
            <button
              style={s.btn("success", !tokenSaved || status === "pushing" || status === "done")}
              onClick={pushToRepo}
              disabled={!tokenSaved || status === "pushing" || status === "done"}
            >
              {status === "pushing" ? (
                <><span style={s.spinner} />Committing…</>
              ) : status === "done" ? "✓ Committed" : "→ Push to Repo"}
            </button>
            <button style={s.btn("ghost")} onClick={reset}>
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Status messages */}
      {status === "done" && (
        <div style={s.statusBar("done")}>
          ✓ Entry committed to {FILE_PATH} · Count updated · Date bumped
        </div>
      )}
      {status === "error" && (
        <div style={s.statusBar("error")}>
          ✗ {errorMsg}
        </div>
      )}
    </div>
  );
}
