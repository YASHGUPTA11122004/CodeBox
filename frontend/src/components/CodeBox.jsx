import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlay, FaExchangeAlt, FaGithub, FaCode, FaTerminal, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BACKEND = "https://codebox-895s.onrender.com";

const LANGS = [
  { value: "python", label: "Python", color: "#3b82f6", icon: "🐍" },
  { value: "c", label: "C", color: "#22c55e", icon: "⚙️" },
];

export default function CodeBox() {
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("python");
  const [running, setRunning] = useState(false);
  const [converting, setConverting] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [outputLines, setOutputLines] = useState([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const currentLang = LANGS.find(l => l.value === language);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (output) {
      const lines = output.split("\n");
      setOutputLines([]);
      lines.forEach((line, i) => {
        setTimeout(() => {
          setOutputLines(prev => [...prev, line]);
        }, i * 40);
      });
    } else {
      setOutputLines([]);
    }
  }, [output]);

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
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
        try { inputObj = JSON.parse(input); } catch (e) {
          setOutput("Invalid input format. Use JSON like {\"input1\": \"5\"}");
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
        setOutput("Server error. Please try again.");
      }
    } catch (err) {
      setOutput("Connection error. Backend may be waking up (cold start ~30s). Please retry.");
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
    } catch (err) {
      setOutput("Error converting code.");
    }
    setConverting(false);
  };

  const lineCount = code.split("\n").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0d",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: "#e2e8f0",
    }}>

      {/* Top Bar */}
      <div style={{
        background: "#111111",
        borderBottom: "1px solid #1e1e1e",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "52px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        {/* Window dots */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4a4a4a" }}>
            <FaCode size={13} />
            <span style={{ fontSize: "13px", color: "#666" }}>codebox</span>
            <span style={{ color: "#333" }}>/</span>
            <span style={{ fontSize: "13px", color: currentLang.color }}>
              {language === "python" ? "main.py" : "main.c"}
            </span>
          </div>
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "6px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px"
          }}>{"<>"}</div>
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" }}>
            Code<span style={{ color: "#3b82f6" }}>Box</span>
          </span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a
            href="https://github.com/YASHGUPTA11122004/CodeBox"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              color: "#666", fontSize: "12px", textDecoration: "none",
              padding: "6px 10px", borderRadius: "6px",
              border: "1px solid #222", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#444"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#222"; }}
          >
            <FaGithub size={14} /> <span>Source</span>
          </a>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 8px #22c55e",
          }} />
          <span style={{ fontSize: "11px", color: "#22c55e" }}>LIVE</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        background: "#111",
        borderBottom: "1px solid #1a1a1a",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "2px",
      }}>
        <div style={{
          padding: "8px 16px",
          fontSize: "12px",
          color: currentLang.color,
          borderBottom: `2px solid ${currentLang.color}`,
          background: "#0d0d0d",
          borderRadius: "4px 4px 0 0",
        }}>
          {currentLang.icon} {language === "python" ? "main.py" : "main.c"}
        </div>
        <div style={{ padding: "8px 16px", fontSize: "12px", color: "#444", cursor: "pointer" }}>
          <FaTerminal size={11} style={{ marginRight: 6 }} />output
        </div>
      </div>

      {/* Main Editor Area */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0",
        minHeight: "calc(100vh - 52px - 37px - 48px)",
      }}>

        {/* LEFT — Editor */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #1a1a1a",
        }}>
          {/* Editor Toolbar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            borderBottom: "1px solid #1a1a1a",
            background: "#0f0f0f",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#444", textTransform: "uppercase", letterSpacing: "1px" }}>Editor</span>
              <span style={{ fontSize: "11px", color: "#333" }}>·</span>
              <span style={{ fontSize: "11px", color: "#555" }}>{lineCount} lines</span>
            </div>

            {/* Language Selector */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "#1a1a1a", border: "1px solid #2a2a2a",
                  borderRadius: "6px", padding: "5px 12px",
                  color: currentLang.color, fontSize: "12px",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <span>{currentLang.icon}</span>
                <span>{currentLang.label}</span>
                <FaChevronDown size={9} style={{ color: "#666" }} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    style={{
                      position: "absolute", top: "calc(100% + 4px)", right: 0,
                      background: "#1a1a1a", border: "1px solid #2a2a2a",
                      borderRadius: "8px", overflow: "hidden", zIndex: 50,
                      minWidth: "120px",
                    }}
                  >
                    {LANGS.map(l => (
                      <div
                        key={l.value}
                        onClick={() => { setLanguage(l.value); setLangOpen(false); }}
                        style={{
                          padding: "9px 14px", fontSize: "12px",
                          color: language === l.value ? l.color : "#888",
                          cursor: "pointer", display: "flex", gap: "8px",
                          background: language === l.value ? "#222" : "transparent",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#222"}
                        onMouseLeave={e => e.currentTarget.style.background = language === l.value ? "#222" : "transparent"}
                      >
                        <span>{l.icon}</span><span>{l.label}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Code Area with line numbers */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* Line Numbers */}
            <div style={{
              background: "#0d0d0d",
              padding: "16px 12px",
              minWidth: "48px",
              textAlign: "right",
              color: "#333",
              fontSize: "13px",
              lineHeight: "1.6",
              userSelect: "none",
              borderRight: "1px solid #1a1a1a",
              fontFamily: "inherit",
            }}>
              {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={language === "python"
                ? "# Write your Python code here...\nprint('Hello, World!')"
                : "// Write your C code here...\n#include <stdio.h>\nint main() {\n    printf(\"Hello, World!\");\n    return 0;\n}"}
              style={{
                flex: 1,
                background: "#0d0d0d",
                color: "#e2e8f0",
                border: "none",
                outline: "none",
                resize: "none",
                padding: "16px",
                fontSize: "13px",
                lineHeight: "1.6",
                fontFamily: "inherit",
                caretColor: currentLang.color,
                tabSize: 4,
              }}
              onKeyDown={e => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const start = e.target.selectionStart;
                  const end = e.target.selectionEnd;
                  const newVal = code.substring(0, start) + "    " + code.substring(end);
                  setCode(newVal);
                  setTimeout(() => e.target.setSelectionRange(start + 4, start + 4), 0);
                }
              }}
            />
          </div>

          {/* Bottom Action Bar */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid #1a1a1a",
            background: "#0f0f0f",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRun}
              disabled={running || !code.trim()}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "9px 20px",
                background: running ? "#1a2a1a" : "linear-gradient(135deg, #16a34a, #15803d)",
                color: running ? "#22c55e" : "#fff",
                border: "1px solid",
                borderColor: running ? "#22c55e44" : "transparent",
                borderRadius: "7px",
                fontSize: "12px", fontWeight: 600,
                cursor: running || !code.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.5px",
              }}
            >
              {running ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ width: 12, height: 12, border: "2px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%" }}
                />
              ) : <FaPlay size={10} />}
              {running ? "Running..." : "Run Code"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleConvert}
              disabled={converting || !code.trim()}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "9px 20px",
                background: converting ? "#1a1a2a" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: converting ? "#8b5cf6" : "#fff",
                border: "1px solid",
                borderColor: converting ? "#8b5cf644" : "transparent",
                borderRadius: "7px",
                fontSize: "12px", fontWeight: 600,
                cursor: converting || !code.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.5px",
              }}
            >
              {converting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ width: 12, height: 12, border: "2px solid #8b5cf6", borderTopColor: "transparent", borderRadius: "50%" }}
                />
              ) : <FaExchangeAlt size={10} />}
              {converting ? "Converting..." : "→ Pseudocode"}
            </motion.button>

            <div style={{ marginLeft: "auto", fontSize: "11px", color: "#333" }}>
              <kbd style={{ background: "#1a1a1a", padding: "2px 6px", borderRadius: "3px", border: "1px solid #2a2a2a", marginRight: 4 }}>Tab</kbd>
              to indent
            </div>
          </div>
        </div>

        {/* RIGHT — Output Terminal */}
        <div style={{ display: "flex", flexDirection: "column", background: "#0a0a0a" }}>
          {/* Output Toolbar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderBottom: "1px solid #1a1a1a", background: "#0f0f0f",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaTerminal size={11} style={{ color: "#444" }} />
              <span style={{ fontSize: "11px", color: "#444", textTransform: "uppercase", letterSpacing: "1px" }}>Output Terminal</span>
            </div>
            <button
              onClick={() => { setOutput(""); setOutputLines([]); }}
              style={{
                background: "none", border: "1px solid #222", borderRadius: "4px",
                color: "#444", fontSize: "11px", padding: "3px 10px", cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#444"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#444"; e.currentTarget.style.borderColor = "#222"; }}
            >
              clear
            </button>
          </div>

          {/* Terminal Content */}
          <div style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
            fontFamily: "inherit",
            fontSize: "13px",
            lineHeight: "1.7",
          }}>
            {outputLines.length === 0 ? (
              <div style={{ color: "#2a2a2a" }}>
                <div style={{ marginBottom: "8px" }}>$ codebox --ready</div>
                <div style={{ color: "#1e3a1e" }}>▶ Write code and hit Run...</div>
              </div>
            ) : (
              <div>
                <div style={{ color: "#444", marginBottom: "12px", fontSize: "11px" }}>
                  $ codebox --run {language === "python" ? "main.py" : "main.c"}
                </div>
                {outputLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    style={{
                      color: typeof line === "object" ? "#3b82f6" : "#4ade80",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {typeof line === "object" ? line.text : line}
                  </motion.div>
                ))}
                <span style={{
                  display: "inline-block", width: "8px", height: "14px",
                  background: "#4ade80",
                  opacity: cursorVisible ? 1 : 0,
                  marginLeft: "2px", verticalAlign: "middle",
                }} />
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div style={{
            padding: "8px 16px",
            borderTop: "1px solid #1a1a1a",
            background: "#0f0f0f",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "11px",
            color: "#333",
          }}>
            <span style={{ color: currentLang.color }}>{currentLang.icon} {currentLang.label}</span>
            <span>·</span>
            <span>{lineCount} lines</span>
            <span>·</span>
            <span>{code.length} chars</span>
            <span style={{ marginLeft: "auto" }}>
              {running ? <span style={{ color: "#22c55e" }}>● Running</span>
                : converting ? <span style={{ color: "#8b5cf6" }}>● Converting</span>
                : <span style={{ color: "#333" }}>○ Ready</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: "#111",
        borderTop: "1px solid #1a1a1a",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "11px",
        color: "#444",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>Built by</span>
          <a
            href="https://linkedin.com/in/yashgupta11122004"
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#3b82f6",
              textDecoration: "none",
              fontWeight: 600,
              letterSpacing: "0.3px",
            }}
          >
            Yash Gupta
          </a>
          <span>·</span>
          <span>B.Tech CSE @ GEHU</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>{"<>"}</span>
          <span>CodeBox</span>
          <span>·</span>
          <span>Python & C Compiler</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a
            href="https://github.com/YASHGUPTA11122004/CodeBox"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#444", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "#444"}
          >
            <FaGithub size={12} /> GitHub
          </a>
          <span>·</span>
          <a
            href="https://portfolio-sdab.vercel.app"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#444", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "#444"}
          >
            Portfolio →
          </a>
        </div>
      </div>
    </div>
  );
}
