import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlay, FaExchangeAlt, FaGithub, FaCode, FaTerminal, FaChevronDown, FaSun, FaMoon, FaCopy, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BACKEND = "https://codebox-895s.onrender.com";

const LANGS = [
  { value: "python", label: "Python", color: "#3b82f6", icon: "🐍" },
  { value: "c", label: "C", color: "#22c55e", icon: "⚙️" },
];

const TEMPLATES = {
  python: [
    {
      label: "Hello World",
      code: `print("Hello, World!")`,
    },
    {
      label: "Fibonacci",
      code: `def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        print(a, end=" ")
        a, b = b, a + b

fibonacci(10)`,
    },
    {
      label: "Factorial",
      code: `def factorial(n):
    if n == 0 or n == 1:
        return 1
    return n * factorial(n - 1)

for i in range(1, 11):
    print(f"{i}! = {factorial(i)}")`,
    },
    {
      label: "Bubble Sort",
      code: `arr = [64, 34, 25, 12, 22, 11, 90]

for i in range(len(arr)):
    for j in range(0, len(arr)-i-1):
        if arr[j] > arr[j+1]:
            arr[j], arr[j+1] = arr[j+1], arr[j]

print("Sorted:", arr)`,
    },
    {
      label: "Prime Check",
      code: `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5)+1):
        if n % i == 0:
            return False
    return True

primes = [x for x in range(2, 50) if is_prime(x)]
print("Primes up to 50:", primes)`,
    },
  ],
  c: [
    {
      label: "Hello World",
      code: `#include <stdio.h>
int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
    },
    {
      label: "Fibonacci",
      code: `#include <stdio.h>
int main() {
    int n = 10, a = 0, b = 1, temp;
    printf("Fibonacci: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", a);
        temp = a + b;
        a = b;
        b = temp;
    }
    return 0;
}`,
    },
    {
      label: "Factorial",
      code: `#include <stdio.h>
long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
int main() {
    for (int i = 1; i <= 10; i++)
        printf("%d! = %ld\\n", i, factorial(i));
    return 0;
}`,
    },
    {
      label: "Bubble Sort",
      code: `#include <stdio.h>
int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = 7, temp;
    for (int i = 0; i < n-1; i++)
        for (int j = 0; j < n-i-1; j++)
            if (arr[j] > arr[j+1]) {
                temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
    printf("Sorted: ");
    for (int i = 0; i < n; i++)
        printf("%d ", arr[i]);
    return 0;
}`,
    },
    {
      label: "Calculator",
      code: `#include <stdio.h>
int main() {
    float a = 10, b = 3;
    printf("Add:      %.2f\\n", a + b);
    printf("Subtract: %.2f\\n", a - b);
    printf("Multiply: %.2f\\n", a * b);
    printf("Divide:   %.2f\\n", a / b);
    return 0;
}`,
    },
  ],
};

export default function CodeBox() {
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("python");
  const [running, setRunning] = useState(false);
  const [converting, setConverting] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [outputLines, setOutputLines] = useState([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [dark, setDark] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hasError, setHasError] = useState(false);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const T = dark ? {
    bg: "#0d0d0d", topbar: "#111111", border: "#1e1e1e", surface: "#0f0f0f",
    surface2: "#1a1a1a", text: "#e2e8f0", dim: "#888", muted: "#555",
    tabActive: "#0d0d0d", outputBg: "#0a0a0a", lineNum: "#444",
    codeBg: "#0d0d0d", codeText: "#e2e8f0", outputText: "#4ade80",
    errorText: "#f87171",
  } : {
    bg: "#f8f8f8", topbar: "#ffffff", border: "#e5e5e5", surface: "#fafafa",
    surface2: "#eeeeee", text: "#1a1a1a", dim: "#555", muted: "#999",
    tabActive: "#ffffff", outputBg: "#f0f2f4", lineNum: "#bbb",
    codeBg: "#1e1e2e", codeText: "#cdd6f4", outputText: "#a6e3a1",
    errorText: "#ef4444",
  };

  const currentLang = LANGS.find(l => l.value === language);
  const currentTemplates = TEMPLATES[language];

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (output) {
      const isError = output.toLowerCase().includes("error") ||
        output.toLowerCase().includes("traceback") ||
        output.toLowerCase().includes("exception");
      setHasError(isError);
      const lines = output.split("\n");
      setOutputLines([]);
      lines.forEach((line, i) => {
        setTimeout(() => setOutputLines(prev => [...prev, line]), i * 40);
      });
    } else {
      setOutputLines([]);
      setHasError(false);
    }
  }, [output]);

  // Ctrl+Enter to run
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (code.trim() && !running) handleRun();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [code, running]);

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    setHasError(false);
    setOutputLines([{ text: "▶ Executing...", type: "info" }]);
    try {
      const postResponse = await fetch(`${BACKEND}/compiler/compile/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const postData = await postResponse.json();
      if (postData.output) {
        setOutput(postData.output);
      } else if (postData.code_id) {
        let inputObj = {};
        try { inputObj = JSON.parse(input); } catch {
          setOutput("Error: Invalid input format. Use JSON like {\"input1\": \"5\"}");
          setRunning(false); return;
        }
        const putResponse = await fetch(`${BACKEND}/compiler/compile/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code_id: postData.code_id, inputs: inputObj }),
        });
        const putData = await putResponse.json();
        setOutput(putData.output || "No output returned.");
      } else {
        setOutput("Error: Server error. Please try again.");
      }
    } catch {
      setOutput("Error: Connection failed. Backend may be waking up (~30s cold start). Please retry.");
    }
    setRunning(false);
  };

  const handleConvert = async () => {
    setConverting(true);
    setOutput("");
    setOutputLines([{ text: "⟳ Converting to pseudocode...", type: "info" }]);
    try {
      const res = await fetch(`${BACKEND}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await res.json();
      setOutput(data.pseudocode || "No pseudocode generated.");
    } catch {
      setOutput("Error: Could not convert code.");
    }
    setConverting(false);
  };

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTemplate = (template) => {
    setCode(template.code);
    setTemplateOpen(false);
    setOutput("");
    setOutputLines([]);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const lineCount = code.split("\n").length;

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: T.text,
      transition: "background 0.3s, color 0.3s",
    }}>

      {/* TOP BAR */}
      <div style={{
        background: T.topbar, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: "52px",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Window controls + path */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {[{ bg: "#ff5f57", symbol: "✕" }, { bg: "#febc2e", symbol: "−" }, { bg: "#28c840", symbol: "+" }].map((btn, i) => (
              <div key={i} style={{
                width: 13, height: 13, borderRadius: "50%", background: btn.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "default", fontSize: "8px", color: "transparent",
                transition: "color 0.15s", fontWeight: 900,
              }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(0,0,0,0.5)"}
                onMouseLeave={e => e.currentTarget.style.color = "transparent"}
              >{btn.symbol}</div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaCode size={12} style={{ color: T.dim }} />
            <span style={{ fontSize: "13px", color: T.dim, fontWeight: 600 }}>codebox</span>
            <span style={{ color: T.muted }}>/</span>
            <span style={{ fontSize: "13px", color: currentLang.color, fontWeight: 700 }}>
              {language === "python" ? "main.py" : "main.c"}
            </span>
          </div>
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 30, height: 30, borderRadius: "7px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 800, color: "#fff",
          }}>{"<>"}</div>
          <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.5px", color: T.text }}>
            Code<span style={{ color: "#3b82f6" }}>Box</span>
          </span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="https://github.com/YASHGUPTA11122004/CodeBox" target="_blank" rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              color: T.dim, fontSize: "13px", fontWeight: 600, textDecoration: "none",
              padding: "6px 12px", borderRadius: "6px", border: `1px solid ${T.border}`, transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.dim; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
          ><FaGithub size={14} /> Source</a>

          <button onClick={() => setDark(!dark)} style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: T.surface2, border: `1px solid ${T.border}`,
            borderRadius: "20px", padding: "5px 14px", cursor: "pointer",
            color: T.text, fontSize: "13px", fontFamily: "inherit", fontWeight: 700,
            transition: "all 0.2s",
          }}>
            <motion.div animate={{ rotate: dark ? 0 : 180 }} transition={{ duration: 0.4 }}>
              {dark ? <FaSun size={13} style={{ color: "#febc2e" }} /> : <FaMoon size={13} style={{ color: "#8b5cf6" }} />}
            </motion.div>
            <span style={{ color: T.dim }}>{dark ? "Light" : "Dark"}</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e55" }} />
            <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 800, letterSpacing: "1px" }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{
        background: T.topbar, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", padding: "0 24px", gap: "2px",
      }}>
        <div style={{
          padding: "9px 18px", fontSize: "13px", fontWeight: 800,
          color: currentLang.color, borderBottom: `2px solid ${currentLang.color}`,
          background: T.tabActive, borderRadius: "4px 4px 0 0",
        }}>
          {currentLang.icon} {language === "python" ? "main.py" : "main.c"}
        </div>
        <div style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 700, color: T.muted }}>
          <FaTerminal size={11} style={{ marginRight: 6 }} />output
        </div>
        <div style={{ marginLeft: "auto", padding: "6px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: T.muted, fontWeight: 600 }}>
            <kbd style={{ background: T.surface2, padding: "2px 6px", borderRadius: "3px", border: `1px solid ${T.border}`, fontSize: "10px" }}>Ctrl</kbd>
            {" + "}
            <kbd style={{ background: T.surface2, padding: "2px 6px", borderRadius: "3px", border: `1px solid ${T.border}`, fontSize: "10px" }}>↵</kbd>
            {" to run"}
          </span>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>

        {/* LEFT: Editor */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: `1px solid ${T.border}` }}>
          {/* Editor Toolbar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderBottom: `1px solid ${T.border}`, background: T.surface,
            gap: "8px", flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: T.dim, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800 }}>Editor</span>
              <span style={{ color: T.muted }}>·</span>
              <span style={{ fontSize: "12px", color: T.dim, fontWeight: 700 }}>{lineCount} lines</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Templates Dropdown */}
              <div style={{ position: "relative" }}>
                <button onClick={() => { setTemplateOpen(!templateOpen); setLangOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  background: T.surface2, border: `1px solid ${T.border}`,
                  borderRadius: "7px", padding: "6px 14px",
                  color: T.dim, fontSize: "12px", fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.dim; }}
                  onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
                >
                  📋 Templates <FaChevronDown size={9} />
                </button>
                <AnimatePresence>
                  {templateOpen && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      style={{
                        position: "absolute", top: "calc(100% + 4px)", left: 0,
                        background: T.topbar, border: `1px solid ${T.border}`,
                        borderRadius: "10px", overflow: "hidden", zIndex: 50, minWidth: "180px",
                        boxShadow: dark ? "0 8px 32px #00000088" : "0 8px 32px #00000022",
                      }}>
                      <div style={{ padding: "8px 14px 4px", fontSize: "10px", color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
                        {currentLang.icon} {currentLang.label} Examples
                      </div>
                      {currentTemplates.map((t, i) => (
                        <div key={i} onClick={() => handleTemplate(t)}
                          style={{
                            padding: "10px 16px", fontSize: "13px", fontWeight: 700,
                            color: T.dim, cursor: "pointer", transition: "all 0.15s",
                            borderTop: i === 0 ? `1px solid ${T.border}` : "none",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = T.surface2; e.currentTarget.style.color = currentLang.color; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.dim; }}
                        >
                          {t.label}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Language Selector */}
              <div style={{ position: "relative" }}>
                <button onClick={() => { setLangOpen(!langOpen); setTemplateOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: T.surface2, border: `1px solid ${T.border}`,
                  borderRadius: "7px", padding: "6px 14px",
                  color: currentLang.color, fontSize: "13px", fontWeight: 800,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  <span>{currentLang.icon}</span>
                  <span>{currentLang.label}</span>
                  <FaChevronDown size={9} style={{ color: T.dim }} />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      style={{
                        position: "absolute", top: "calc(100% + 4px)", right: 0,
                        background: T.topbar, border: `1px solid ${T.border}`,
                        borderRadius: "8px", overflow: "hidden", zIndex: 50, minWidth: "130px",
                        boxShadow: dark ? "0 8px 32px #00000088" : "0 8px 32px #00000022",
                      }}>
                      {LANGS.map(l => (
                        <div key={l.value} onClick={() => { setLanguage(l.value); setLangOpen(false); setCode(""); setOutput(""); }}
                          style={{
                            padding: "10px 16px", fontSize: "13px", fontWeight: 700,
                            color: language === l.value ? l.color : T.dim,
                            cursor: "pointer", display: "flex", gap: "8px",
                            background: language === l.value ? T.surface2 : "transparent",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = T.surface2}
                          onMouseLeave={e => e.currentTarget.style.background = language === l.value ? T.surface2 : "transparent"}
                        >
                          <span>{l.icon}</span><span>{l.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Code Area */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }} onClick={() => { setTemplateOpen(false); setLangOpen(false); }}>
            <div style={{
              background: T.codeBg, padding: "16px 12px", minWidth: "52px",
              textAlign: "right", color: T.lineNum, fontSize: "13px",
              lineHeight: "1.65", userSelect: "none", borderRight: `1px solid ${T.border}`,
              fontFamily: "inherit",
            }}>
              {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={language === "python"
                ? "# Write your Python code here...\n# Ctrl+Enter to run\nprint('Hello, World!')"
                : "// Write your C code here\n// Ctrl+Enter to run\n#include <stdio.h>\nint main() {\n    printf(\"Hello!\");\n    return 0;\n}"}
              style={{
                flex: 1, background: T.codeBg, color: T.codeText,
                border: "none", outline: "none", resize: "none",
                padding: "16px", fontSize: "13px", lineHeight: "1.65",
                fontFamily: "inherit", caretColor: currentLang.color, tabSize: 4,
              }}
              onKeyDown={e => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const s = e.target.selectionStart, en = e.target.selectionEnd;
                  const v = code.substring(0, s) + "    " + code.substring(en);
                  setCode(v);
                  setTimeout(() => e.target.setSelectionRange(s + 4, s + 4), 0);
                }
              }}
            />
          </div>

          {/* Action Bar */}
          <div style={{
            padding: "12px 16px", borderTop: `1px solid ${T.border}`,
            background: T.surface, display: "flex", alignItems: "center", gap: "10px",
          }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleRun} disabled={running || !code.trim()}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px",
                background: running ? (dark ? "#1a2a1a" : "#dcfce7") : "linear-gradient(135deg, #16a34a, #15803d)",
                color: running ? "#22c55e" : "#fff",
                border: `1px solid ${running ? "#22c55e44" : "transparent"}`,
                borderRadius: "8px", fontSize: "13px", fontWeight: 800,
                cursor: running || !code.trim() ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>
              {running
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ width: 13, height: 13, border: "2px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%" }} />
                : <FaPlay size={11} />}
              {running ? "Running..." : "Run Code"}
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleConvert} disabled={converting || !code.trim()}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px",
                background: converting ? (dark ? "#1a1a2a" : "#ede9fe") : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: converting ? "#8b5cf6" : "#fff",
                border: `1px solid ${converting ? "#8b5cf644" : "transparent"}`,
                borderRadius: "8px", fontSize: "13px", fontWeight: 800,
                cursor: converting || !code.trim() ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>
              {converting
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ width: 13, height: 13, border: "2px solid #8b5cf6", borderTopColor: "transparent", borderRadius: "50%" }} />
                : <FaExchangeAlt size={11} />}
              {converting ? "Converting..." : "→ Pseudocode"}
            </motion.button>

            {code.trim() && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setCode(""); setOutput(""); setOutputLines([]); }}
                style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
                  background: "none", border: `1px solid ${T.border}`,
                  borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                  color: T.dim, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.dim; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
              >Clear</motion.button>
            )}

            <div style={{ marginLeft: "auto", fontSize: "11px", color: T.muted, fontWeight: 600 }}>
              <kbd style={{ background: T.surface2, padding: "2px 7px", borderRadius: "4px", border: `1px solid ${T.border}`, marginRight: 4, fontFamily: "inherit", fontSize: "10px" }}>Tab</kbd>
              indent
            </div>
          </div>
        </div>

        {/* RIGHT: Output */}
        <div style={{ display: "flex", flexDirection: "column", background: T.outputBg }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderBottom: `1px solid ${T.border}`, background: T.surface,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaTerminal size={12} style={{ color: hasError ? "#f87171" : T.dim }} />
              <span style={{
                fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800,
                color: hasError ? "#f87171" : T.dim,
              }}>
                {hasError ? "⚠ Error" : "Output Terminal"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {/* Copy Output Button */}
              {output && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleCopyOutput}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: copied ? (dark ? "#1a2a1a" : "#dcfce7") : T.surface2,
                    border: `1px solid ${copied ? "#22c55e44" : T.border}`,
                    borderRadius: "5px", color: copied ? "#22c55e" : T.dim,
                    fontSize: "12px", fontWeight: 700, padding: "4px 12px",
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                  }}
                >
                  {copied ? <FaCheck size={11} /> : <FaCopy size={11} />}
                  {copied ? "Copied!" : "Copy"}
                </motion.button>
              )}
              <button onClick={() => { setOutput(""); setOutputLines([]); setHasError(false); }}
                style={{
                  background: "none", border: `1px solid ${T.border}`, borderRadius: "5px",
                  color: T.dim, fontSize: "12px", fontWeight: 700, padding: "4px 12px",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.dim; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = T.border; }}
              >clear</button>
            </div>
          </div>

          <div style={{ flex: 1, padding: "20px", overflowY: "auto", fontFamily: "inherit", fontSize: "13px", lineHeight: "1.7" }}>
            {outputLines.length === 0 ? (
              <div>
                <div style={{ color: T.muted, marginBottom: "8px", fontWeight: 600 }}>$ codebox --ready</div>
                <div style={{ color: dark ? "#1e3a1e" : "#86efac", fontWeight: 500 }}>▶ Write code or pick a template and hit Run...</div>
                <div style={{ marginTop: "16px", color: T.muted, fontSize: "11px", fontWeight: 600 }}>
                  <div>Shortcuts:</div>
                  <div style={{ marginTop: "4px" }}>
                    <kbd style={{ background: T.surface2, padding: "1px 5px", borderRadius: "3px", border: `1px solid ${T.border}`, marginRight: 4, fontSize: "10px" }}>Ctrl+Enter</kbd>
                    Run code
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    <kbd style={{ background: T.surface2, padding: "1px 5px", borderRadius: "3px", border: `1px solid ${T.border}`, marginRight: 4, fontSize: "10px" }}>Tab</kbd>
                    Indent
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ color: T.dim, marginBottom: "12px", fontSize: "12px", fontWeight: 700 }}>
                  $ codebox --run {language === "python" ? "main.py" : "main.c"}
                </div>
                {outputLines.map((line, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.1 }}
                    style={{
                      color: typeof line === "object"
                        ? "#3b82f6"
                        : (hasError ? T.errorText : T.outputText),
                      whiteSpace: "pre-wrap", wordBreak: "break-all", fontWeight: 600,
                    }}>
                    {typeof line === "object" ? line.text : line}
                  </motion.div>
                ))}
                {!hasError && (
                  <span style={{
                    display: "inline-block", width: "8px", height: "15px",
                    background: T.outputText, opacity: cursorVisible ? 1 : 0,
                    marginLeft: "2px", verticalAlign: "middle",
                  }} />
                )}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div style={{
            padding: "8px 16px", borderTop: `1px solid ${T.border}`, background: T.surface,
            display: "flex", alignItems: "center", gap: "16px",
            fontSize: "12px", color: T.dim, fontWeight: 700,
          }}>
            <span style={{ color: currentLang.color }}>{currentLang.icon} {currentLang.label}</span>
            <span style={{ color: T.muted }}>·</span>
            <span>{lineCount} lines</span>
            <span style={{ color: T.muted }}>·</span>
            <span>{code.length} chars</span>
            <span style={{ marginLeft: "auto" }}>
              {running ? <span style={{ color: "#22c55e" }}>● Running</span>
                : converting ? <span style={{ color: "#8b5cf6" }}>● Converting</span>
                : hasError ? <span style={{ color: "#f87171" }}>✕ Error</span>
                : output ? <span style={{ color: "#22c55e" }}>✓ Done</span>
                : <span style={{ color: T.muted }}>○ Ready</span>}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        background: T.topbar, borderTop: `1px solid ${T.border}`,
        padding: "14px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", fontSize: "12px", color: T.dim, fontWeight: 700,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: T.muted }}>Built by</span>
          <a href="https://linkedin.com/in/yashgupta11122004" target="_blank" rel="noreferrer"
            style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 900 }}>
            Yash Gupta
          </a>
          <span style={{ color: T.muted }}>·</span>
          <span>B.Tech CSE @ GEHU</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#3b82f6", fontWeight: 900 }}>{"<>"}</span>
          <span>CodeBox</span>
          <span style={{ color: T.muted }}>·</span>
          <span>Python & C Compiler</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="https://github.com/YASHGUPTA11122004/CodeBox" target="_blank" rel="noreferrer"
            style={{ color: T.dim, textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.dim}
          ><FaGithub size={13} /> GitHub</a>
          <span style={{ color: T.muted }}>·</span>
          <a href="https://portfolio-sdab.vercel.app" target="_blank" rel="noreferrer"
            style={{ color: T.dim, textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.dim}
          >Portfolio →</a>
        </div>
      </div>
    </div>
  );
}
