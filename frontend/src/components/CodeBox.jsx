import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlay, FaExchangeAlt, FaGithub, FaCode, FaTerminal, FaChevronDown, FaSun, FaMoon, FaCopy, FaCheck, FaKeyboard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BACKEND = "https://codebox-895s.onrender.com";

const LANGS = [
  { value: "python", label: "Python", color: "#3b82f6", icon: "🐍" },
  { value: "c", label: "C", color: "#16a34a", icon: "⚙️" },
];

const TEMPLATES = {
  python: [
    { label: "Hello World", code: `print("Hello, World!")` },
    { label: "Fibonacci", code: `def fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a, end=" ")\n        a, b = b, a + b\n\nfibonacci(10)` },
    { label: "Factorial", code: `def factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    return n * factorial(n - 1)\n\nfor i in range(1, 11):\n    print(f"{i}! = {factorial(i)}")` },
    { label: "Bubble Sort", code: `arr = [64, 34, 25, 12, 22, 11, 90]\n\nfor i in range(len(arr)):\n    for j in range(0, len(arr)-i-1):\n        if arr[j] > arr[j+1]:\n            arr[j], arr[j+1] = arr[j+1], arr[j]\n\nprint("Sorted:", arr)` },
    { label: "Prime Check", code: `def is_prime(n):\n    if n < 2: return False\n    for i in range(2, int(n**0.5)+1):\n        if n % i == 0: return False\n    return True\n\nprimes = [x for x in range(2, 50) if is_prime(x)]\nprint("Primes up to 50:", primes)` },
  ],
  c: [
    { label: "Hello World", code: `#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}` },
    { label: "Fibonacci", code: `#include <stdio.h>\nint main() {\n    int n = 10, a = 0, b = 1, temp;\n    printf("Fibonacci: ");\n    for (int i = 0; i < n; i++) {\n        printf("%d ", a);\n        temp = a + b; a = b; b = temp;\n    }\n    return 0;\n}` },
    { label: "Factorial", code: `#include <stdio.h>\nlong factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\nint main() {\n    for (int i = 1; i <= 10; i++)\n        printf("%d! = %ld\\n", i, factorial(i));\n    return 0;\n}` },
    { label: "Bubble Sort", code: `#include <stdio.h>\nint main() {\n    int arr[] = {64, 34, 25, 12, 22, 11, 90};\n    int n = 7, temp;\n    for (int i = 0; i < n-1; i++)\n        for (int j = 0; j < n-i-1; j++)\n            if (arr[j] > arr[j+1]) {\n                temp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = temp;\n            }\n    printf("Sorted: ");\n    for (int i = 0; i < n; i++) printf("%d ", arr[i]);\n    return 0;\n}` },
    { label: "Calculator", code: `#include <stdio.h>\nint main() {\n    float a = 10, b = 3;\n    printf("Add:      %.2f\\n", a + b);\n    printf("Subtract: %.2f\\n", a - b);\n    printf("Multiply: %.2f\\n", a * b);\n    printf("Divide:   %.2f\\n", a / b);\n    return 0;\n}` },
  ],
};

const SHORTCUTS = [
  { keys: ["Ctrl", "Enter"], desc: "Run code" },
  { keys: ["Tab"], desc: "Indent 4 spaces" },
  { keys: ["Ctrl", "A"], desc: "Select all" },
  { keys: ["Ctrl", "Z"], desc: "Undo" },
  { keys: ["Esc"], desc: "Close popups" },
];

// ── THEME TOKENS ──────────────────────────────────────────
const DARK = {
  bg:        "#0d0d0d",
  topbar:    "#111111",
  border:    "#1e1e1e",
  surface:   "#0f0f0f",
  surface2:  "#1a1a1a",
  text:      "#e2e8f0",
  dim:       "#888",
  muted:     "#444",
  // editor
  codeBg:    "#0d0d0d",
  codeText:  "#e2e8f0",
  lineNum:   "#333",
  // terminal
  outputBg:  "#0a0a0a",
  outputText:"#4ade80",
  errorText: "#f87171",
  promptCol: "#555",
};

const LIGHT = {
  bg:        "#f4f4f5",
  topbar:    "#ffffff",
  border:    "#d4d4d8",
  surface:   "#fafafa",
  surface2:  "#ededee",
  text:      "#18181b",
  dim:       "#52525b",
  muted:     "#a1a1aa",
  // editor — stays light, consistent with UI
  codeBg:    "#f8f8f9",
  codeText:  "#1e1e2e",
  lineNum:   "#a1a1aa",
  // terminal — slightly darker panel
  outputBg:  "#ececee",
  outputText:"#166534",   // dark green — readable on light
  errorText: "#b91c1c",   // dark red — readable on light
  promptCol: "#71717a",
};

export default function CodeBox() {
  const [code, setCode]           = useState("");
  const [output, setOutput]       = useState("");
  const [language, setLanguage]   = useState("python");
  const [running, setRunning]     = useState(false);
  const [converting, setConverting] = useState(false);
  const [langOpen, setLangOpen]   = useState(false);
  const [tmplOpen, setTmplOpen]   = useState(false);
  const [helpOpen, setHelpOpen]   = useState(false);
  const [outLines, setOutLines]   = useState([]);
  const [blink, setBlink]         = useState(true);
  const [dark, setDark]           = useState(true);
  const [copied, setCopied]       = useState(false);
  const [hasError, setHasError]   = useState(false);
  const textareaRef = useRef(null);

  const T = dark ? DARK : LIGHT;
  const lang = LANGS.find(l => l.value === language);

  // cursor blink
  useEffect(() => {
    const id = setInterval(() => setBlink(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  // stream output lines
  useEffect(() => {
    if (!output) { setOutLines([]); setHasError(false); return; }
    const isErr = /error|traceback|exception/i.test(output);
    setHasError(isErr);
    const lines = output.split("\n");
    setOutLines([]);
    lines.forEach((ln, i) => setTimeout(() => setOutLines(p => [...p, ln]), i * 35));
  }, [output]);

  // global keyboard
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (code.trim() && !running) handleRun();
      }
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [code, running]);

  const closeAll = () => { setLangOpen(false); setTmplOpen(false); setHelpOpen(false); };

  const handleRun = async () => {
    setRunning(true); setOutput(""); setHasError(false);
    setOutLines([{ info: true, text: "▶  Executing…" }]);
    try {
      const r1 = await fetch(`${BACKEND}/compiler/compile/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const d1 = await r1.json();
      if (d1.output) {
        setOutput(d1.output);
      } else if (d1.code_id) {
        const r2 = await fetch(`${BACKEND}/compiler/compile/`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code_id: d1.code_id, inputs: {} }),
        });
        const d2 = await r2.json();
        setOutput(d2.output || "No output returned.");
      } else {
        setOutput("Error: Server error — please try again.");
      }
    } catch {
      setOutput("Error: Connection failed. Backend may be cold-starting (~30 s). Please retry.");
    }
    setRunning(false);
  };

  const handleConvert = async () => {
    setConverting(true); setOutput("");
    setOutLines([{ info: true, text: "⟳  Converting to pseudocode…" }]);
    try {
      const r = await fetch(`${BACKEND}/convert`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const d = await r.json();
      setOutput(d.pseudocode || "No pseudocode generated.");
    } catch {
      setOutput("Error: Could not convert code.");
    }
    setConverting(false);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadTemplate = (t) => {
    setCode(t.code); setTmplOpen(false); setOutput(""); setOutLines([]);
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const lineCount = code.split("\n").length;

  // ── shared sub-styles ──────────────────────────────────
  const btnBase = {
    display: "flex", alignItems: "center", gap: "8px",
    borderRadius: "8px", fontSize: "13px", fontWeight: 800,
    cursor: "pointer", fontFamily: "inherit", border: "1px solid transparent",
    padding: "9px 20px", transition: "opacity 0.15s",
  };

  const ghostBtn = {
    background: "none", border: `1px solid ${T.border}`,
    borderRadius: "7px", padding: "5px 12px",
    color: T.dim, fontSize: "12px", fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
  };

  const Kbd = ({ k }) => (
    <kbd style={{
      background: T.surface2, padding: "2px 7px", borderRadius: "4px",
      border: `1px solid ${T.border}`, fontFamily: "inherit",
      fontSize: "11px", color: T.dim, fontWeight: 700,
    }}>{k}</kbd>
  );

  const Spinner = ({ color }) => (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      style={{ width: 13, height: 13, border: `2px solid ${color}`, borderTopColor: "transparent", borderRadius: "50%" }} />
  );

  const Dropdown = ({ open, children, right }) => (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", top: "calc(100% + 6px)",
            [right ? "right" : "left"]: 0,
            background: T.topbar, border: `1px solid ${T.border}`,
            borderRadius: "10px", overflow: "hidden", zIndex: 200,
            boxShadow: dark ? "0 12px 40px #00000099" : "0 8px 32px #00000018",
            minWidth: "180px",
          }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", fontFamily: "'JetBrains Mono','Fira Code',monospace", color: T.text, transition: "background 0.25s, color 0.25s" }}
      onClick={closeAll}>

      {/* ── TOPBAR ────────────────────────────────────── */}
      <header style={{ background: T.topbar, borderBottom: `1px solid ${T.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px", position: "sticky", top: 0, zIndex: 100 }}
        onClick={e => e.stopPropagation()}>

        {/* left: window dots + path */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ display: "flex", gap: "7px" }}>
            {[["#ff5f57","✕"],["#febc2e","−"],["#28c840","+"]].map(([bg, sym], i) => (
              <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "transparent", fontWeight: 900, transition: "color 0.12s", cursor: "default" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(0,0,0,0.45)"}
                onMouseLeave={e => e.currentTarget.style.color = "transparent"}
              >{sym}</div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px" }}>
            <FaCode size={11} style={{ color: T.dim }} />
            <span style={{ color: T.dim, fontWeight: 600 }}>codebox</span>
            <span style={{ color: T.muted }}>/</span>
            <span style={{ color: lang.color, fontWeight: 700 }}>{language === "python" ? "main.py" : "main.c"}</span>
          </div>
        </div>

        {/* center: logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={{ width: 30, height: 30, borderRadius: "7px", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#fff" }}>{"<>"}</div>
          <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.5px" }}>Code<span style={{ color: "#3b82f6" }}>Box</span></span>
        </div>

        {/* right: github + theme + live */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <a href="https://github.com/YASHGUPTA11122004/CodeBox" target="_blank" rel="noreferrer"
            style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.dim; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
          ><FaGithub size={13} /> Source</a>

          <button onClick={() => setDark(!dark)}
            style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: "7px", borderRadius: "20px", padding: "5px 14px" }}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.dim; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
          >
            <motion.div animate={{ rotate: dark ? 0 : 180 }} transition={{ duration: 0.4 }}>
              {dark ? <FaSun size={13} style={{ color: "#f59e0b" }} /> : <FaMoon size={13} style={{ color: "#8b5cf6" }} />}
            </motion.div>
            <span>{dark ? "Light" : "Dark"}</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 7px #22c55e66" }} />
            <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 800, letterSpacing: "1px" }}>LIVE</span>
          </div>
        </div>
      </header>

      {/* ── TAB BAR ───────────────────────────────────── */}
      <div style={{ background: T.topbar, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: "2px" }}>
        <div style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 800, color: lang.color, borderBottom: `2px solid ${lang.color}`, background: T.bg, borderRadius: "4px 4px 0 0" }}>
          {lang.icon} {language === "python" ? "main.py" : "main.c"}
        </div>
        <div style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 700, color: T.muted }}>
          <FaTerminal size={10} style={{ marginRight: 6 }} />output
        </div>
      </div>

      {/* ── MAIN SPLIT ────────────────────────────────── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>

        {/* LEFT — editor */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: `1px solid ${T.border}` }}>

          {/* editor toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: `1px solid ${T.border}`, background: T.surface }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: T.dim, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800 }}>Editor</span>
              <span style={{ color: T.muted, fontSize: "12px" }}>·</span>
              <span style={{ fontSize: "12px", color: T.dim, fontWeight: 700 }}>{lineCount} lines</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>

              {/* Templates */}
              <div style={{ position: "relative" }}>
                <button style={{ ...ghostBtn }}
                  onClick={e => { e.stopPropagation(); setTmplOpen(o => !o); setLangOpen(false); }}
                  onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.dim; }}
                  onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
                >
                  📋 Templates &nbsp;<FaChevronDown size={8} />
                </button>
                <Dropdown open={tmplOpen}>
                  <div style={{ padding: "9px 14px 5px", fontSize: "10px", color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
                    {lang.icon} {lang.label} examples
                  </div>
                  {TEMPLATES[language].map((t, i) => (
                    <div key={i} onClick={() => loadTemplate(t)}
                      style={{ padding: "9px 16px", fontSize: "13px", fontWeight: 700, color: T.dim, cursor: "pointer", borderTop: `1px solid ${T.border}`, transition: "all 0.12s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.surface2; e.currentTarget.style.color = lang.color; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.dim; }}
                    >{t.label}</div>
                  ))}
                </Dropdown>
              </div>

              {/* Language */}
              <div style={{ position: "relative" }}>
                <button style={{ ...ghostBtn, color: lang.color, fontWeight: 800, fontSize: "13px" }}
                  onClick={e => { e.stopPropagation(); setLangOpen(o => !o); setTmplOpen(false); }}
                >
                  {lang.icon} {lang.label} <FaChevronDown size={8} style={{ color: T.dim, marginLeft: 4 }} />
                </button>
                <Dropdown open={langOpen} right>
                  {LANGS.map(l => (
                    <div key={l.value}
                      onClick={() => { setLanguage(l.value); setLangOpen(false); setCode(""); setOutput(""); }}
                      style={{ padding: "10px 16px", fontSize: "13px", fontWeight: 700, color: language === l.value ? l.color : T.dim, cursor: "pointer", display: "flex", gap: "8px", background: language === l.value ? T.surface2 : "transparent", transition: "all 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surface2}
                      onMouseLeave={e => e.currentTarget.style.background = language === l.value ? T.surface2 : "transparent"}
                    >{l.icon} {l.label}</div>
                  ))}
                </Dropdown>
              </div>
            </div>
          </div>

          {/* code + line numbers */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden", background: T.codeBg }}>
            <div style={{ padding: "16px 10px 16px 8px", minWidth: "48px", textAlign: "right", color: T.lineNum, fontSize: "13px", lineHeight: "21.45px", userSelect: "none", borderRight: `1px solid ${T.border}`, fontFamily: "inherit", overflowY: "hidden" }}>
              {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
                <div key={i} style={{ height: "21.45px" }}>{i + 1}</div>
              ))}
            </div>
            <textarea ref={textareaRef} value={code} onChange={e => setCode(e.target.value)}
              placeholder={language === "python" ? "# Write Python code here…\nprint('Hello, World!')" : "// Write C code here…\n#include <stdio.h>\nint main() {\n    printf(\"Hello!\");\n    return 0;\n}"}
              style={{ flex: 1, background: T.codeBg, color: T.codeText, border: "none", outline: "none", resize: "none", padding: "16px", fontSize: "13px", lineHeight: "1.65", fontFamily: "inherit", caretColor: lang.color, tabSize: 4 }}
              onKeyDown={e => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const s = e.target.selectionStart, en = e.target.selectionEnd;
                  setCode(code.substring(0, s) + "    " + code.substring(en));
                  setTimeout(() => e.target.setSelectionRange(s + 4, s + 4), 0);
                }
              }}
            />
          </div>

          {/* action bar */}
          <div style={{ padding: "11px 16px", borderTop: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", gap: "9px" }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleRun} disabled={running || !code.trim()}
              style={{ ...btnBase, background: running ? (dark ? "#162016" : "#dcfce7") : "linear-gradient(135deg,#16a34a,#15803d)", color: running ? "#22c55e" : "#fff", borderColor: running ? "#22c55e33" : "transparent", opacity: !code.trim() ? 0.45 : 1 }}
            >
              {running ? <Spinner color="#22c55e" /> : <FaPlay size={10} />}
              {running ? "Running…" : "Run Code"}
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleConvert} disabled={converting || !code.trim()}
              style={{ ...btnBase, background: converting ? (dark ? "#160f20" : "#ede9fe") : "linear-gradient(135deg,#7c3aed,#6d28d9)", color: converting ? "#8b5cf6" : "#fff", borderColor: converting ? "#8b5cf633" : "transparent", opacity: !code.trim() ? 0.45 : 1 }}
            >
              {converting ? <Spinner color="#8b5cf6" /> : <FaExchangeAlt size={10} />}
              {converting ? "Converting…" : "→ Pseudocode"}
            </motion.button>

            {code.trim() && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setCode(""); setOutput(""); setOutLines([]); }}
                style={{ ...ghostBtn, padding: "9px 16px" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef444466"; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
              >Clear</motion.button>
            )}
          </div>
        </div>

        {/* RIGHT — output */}
        <div style={{ display: "flex", flexDirection: "column", background: T.outputBg, position: "relative" }}>

          {/* output toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaTerminal size={11} style={{ color: hasError ? T.errorText : T.dim }} />
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800, color: hasError ? T.errorText : T.dim }}>
                {hasError ? "⚠ Error" : "Output Terminal"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "7px" }}>
              {output && (
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: "5px", color: copied ? "#22c55e" : T.dim, borderColor: copied ? "#22c55e44" : T.border }}
                  onMouseEnter={e => { if (!copied) { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.dim; } }}
                  onMouseLeave={e => { if (!copied) { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; } }}
                >
                  {copied ? <FaCheck size={10} /> : <FaCopy size={10} />}
                  {copied ? "Copied!" : "Copy"}
                </motion.button>
              )}
              <button style={{ ...ghostBtn }}
                onClick={() => { setOutput(""); setOutLines([]); setHasError(false); }}
                onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.dim; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
              >clear</button>
            </div>
          </div>

          {/* terminal body */}
          <div style={{ flex: 1, padding: "20px", overflowY: "auto", fontFamily: "inherit", fontSize: "13px", lineHeight: "1.75" }}>
            {outLines.length === 0 ? (
              <div>
                <div style={{ color: T.promptCol, marginBottom: "6px", fontWeight: 600 }}>$ codebox --ready</div>
                <div style={{ color: dark ? "#1d3a1d" : "#4ade8088", fontWeight: 600 }}>▶ Write code or pick a template, then hit Run…</div>
                <div style={{ marginTop: "20px", borderTop: `1px solid ${T.border}`, paddingTop: "14px" }}>
                  <div style={{ color: T.muted, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Tip — keyboard shortcuts</div>
                  {[["Ctrl+Enter","Run code"],["Tab","Indent"],["Esc","Close menus"]].map(([k, d], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <kbd style={{ background: T.surface2, padding: "2px 8px", borderRadius: "4px", border: `1px solid ${T.border}`, fontSize: "11px", color: T.dim, fontWeight: 700, fontFamily: "inherit" }}>{k}</kbd>
                      <span style={{ fontSize: "12px", color: T.muted, fontWeight: 600 }}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ color: T.promptCol, marginBottom: "10px", fontSize: "12px", fontWeight: 700 }}>
                  $ codebox --run {language === "python" ? "main.py" : "main.c"}
                </div>
                {outLines.map((ln, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.08 }}
                    style={{ color: ln.info ? (dark ? "#3b82f6" : "#1d4ed8") : (hasError ? T.errorText : T.outputText), whiteSpace: "pre-wrap", wordBreak: "break-all", fontWeight: 600 }}
                  >{ln.info ? ln.text : ln}</motion.div>
                ))}
                {!hasError && (
                  <span style={{ display: "inline-block", width: 8, height: 15, background: T.outputText, opacity: blink ? 1 : 0, marginLeft: 2, verticalAlign: "middle" }} />
                )}
              </div>
            )}
          </div>

          {/* status bar */}
          <div style={{ padding: "7px 16px", borderTop: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", gap: "14px", fontSize: "11px", color: T.dim, fontWeight: 700 }}>
            <span style={{ color: lang.color }}>{lang.icon} {lang.label}</span>
            <span style={{ color: T.muted }}>·</span>
            <span>{lineCount} lines</span>
            <span style={{ color: T.muted }}>·</span>
            <span>{code.length} chars</span>
            <span style={{ marginLeft: "auto" }}>
              {running    ? <span style={{ color: "#22c55e" }}>● Running</span>
              : converting ? <span style={{ color: "#8b5cf6" }}>● Converting</span>
              : hasError   ? <span style={{ color: T.errorText }}>✕ Error</span>
              : output     ? <span style={{ color: "#22c55e" }}>✓ Done</span>
              :              <span style={{ color: T.muted }}>○ Ready</span>}
            </span>
          </div>

          {/* ? help button */}
          <div style={{ position: "absolute", bottom: "48px", right: "14px", zIndex: 50 }}>
            <AnimatePresence>
              {helpOpen && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  onClick={e => e.stopPropagation()}
                  style={{ position: "absolute", bottom: "44px", right: 0, background: T.topbar, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "16px 18px", minWidth: "240px", boxShadow: dark ? "0 16px 48px #00000099" : "0 8px 32px #00000022" }}
                >
                  <div style={{ fontSize: "10px", color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaKeyboard size={11} /> Keyboard shortcuts
                  </div>
                  {SHORTCUTS.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                      <span style={{ fontSize: "12px", color: T.dim, fontWeight: 600 }}>{s.desc}</span>
                      <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                        {s.keys.map((k, j) => (
                          <span key={j} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            <Kbd k={k} />
                            {j < s.keys.length - 1 && <span style={{ color: T.muted, fontSize: "11px" }}>+</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
              onClick={e => { e.stopPropagation(); setHelpOpen(o => !o); }}
              style={{ width: 34, height: 34, borderRadius: "50%", background: helpOpen ? "linear-gradient(135deg,#3b82f6,#8b5cf6)" : T.surface2, border: `1px solid ${helpOpen ? "transparent" : T.border}`, color: helpOpen ? "#fff" : T.dim, fontSize: "15px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: helpOpen ? "0 4px 20px #3b82f644" : "none", transition: "all 0.2s" }}
            >?</motion.button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer style={{ background: T.topbar, borderTop: `1px solid ${T.border}`, padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: T.dim, fontWeight: 700 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: T.muted }}>Built by</span>
          <a href="https://linkedin.com/in/yashgupta11122004" target="_blank" rel="noreferrer"
            style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 900 }}>Yash Gupta</a>
          <span style={{ color: T.muted }}>·</span>
          <span>B.Tech CSE @ GEHU</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#3b82f6", fontWeight: 900 }}>{"<>"}</span>
          <span>CodeBox</span>
          <span style={{ color: T.muted }}>·</span>
          <span>Python & C Compiler</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <a href="https://github.com/YASHGUPTA11122004/CodeBox" target="_blank" rel="noreferrer"
            style={{ color: T.dim, textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.dim}
          ><FaGithub size={12} /> GitHub</a>
          <span style={{ color: T.muted }}>·</span>
          <a href="https://portfolio-sdab.vercel.app" target="_blank" rel="noreferrer"
            style={{ color: T.dim, textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.dim}
          >Portfolio →</a>
        </div>
      </footer>
    </div>
  );
}
