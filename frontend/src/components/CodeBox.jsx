import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaPlay, FaExchangeAlt, FaGithub, FaCode, FaTerminal, FaChevronDown, FaSun, FaMoon, FaCopy, FaCheck, FaKeyboard } from "react-icons/fa";

const BACKEND = "https://codebox-895s.onrender.com";

const LANGS = [
  { value:"python", label:"Python", color:"#3b82f6", icon:"🐍" },
  { value:"c",      label:"C",      color:"#16a34a", icon:"⚙️" },
];

const TEMPLATES = {
  python: [
    { label:"Hello World",  code:`print("Hello, World!")` },
    { label:"Fibonacci",    code:`def fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a, end=" ")\n        a, b = b, a + b\n\nfibonacci(10)` },
    { label:"Factorial",    code:`def factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    return n * factorial(n - 1)\n\nfor i in range(1, 11):\n    print(f"{i}! = {factorial(i)}")` },
    { label:"Bubble Sort",  code:`arr = [64, 34, 25, 12, 22, 11, 90]\nfor i in range(len(arr)):\n    for j in range(len(arr)-i-1):\n        if arr[j] > arr[j+1]:\n            arr[j], arr[j+1] = arr[j+1], arr[j]\nprint("Sorted:", arr)` },
    { label:"Prime Check",  code:`def is_prime(n):\n    if n < 2: return False\n    for i in range(2, int(n**0.5)+1):\n        if n % i == 0: return False\n    return True\n\nprint([x for x in range(2,50) if is_prime(x)])` },
  ],
  c: [
    { label:"Hello World",  code:`#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}` },
    { label:"Fibonacci",    code:`#include <stdio.h>\nint main() {\n    int n=10,a=0,b=1,t;\n    for(int i=0;i<n;i++){printf("%d ",a);t=a+b;a=b;b=t;}\n    return 0;\n}` },
    { label:"Factorial",    code:`#include <stdio.h>\nlong fact(int n){return n<=1?1:n*fact(n-1);}\nint main(){\n    for(int i=1;i<=10;i++) printf("%d! = %ld\\n",i,fact(i));\n    return 0;\n}` },
    { label:"Bubble Sort",  code:`#include <stdio.h>\nint main(){\n    int a[]={64,34,25,12,22,11,90},n=7,t;\n    for(int i=0;i<n-1;i++)\n        for(int j=0;j<n-i-1;j++)\n            if(a[j]>a[j+1]){t=a[j];a[j]=a[j+1];a[j+1]=t;}\n    for(int i=0;i<n;i++) printf("%d ",a[i]);\n    return 0;\n}` },
    { label:"Calculator",   code:`#include <stdio.h>\nint main(){\n    float a=10,b=3;\n    printf("Add:      %.2f\\n",a+b);\n    printf("Subtract: %.2f\\n",a-b);\n    printf("Multiply: %.2f\\n",a*b);\n    printf("Divide:   %.2f\\n",a/b);\n    return 0;\n}` },
  ],
};

const SHORTCUTS = [
  { keys:["Ctrl","Enter"], desc:"Run code" },
  { keys:["Tab"],          desc:"Indent 4 spaces" },
  { keys:["Ctrl","A"],     desc:"Select all" },
  { keys:["Ctrl","Z"],     desc:"Undo" },
  { keys:["Esc"],          desc:"Close menus" },
];

const DARK = {
  bg:"#0d0d0d", topbar:"#111", border:"#222", surface:"#111",
  surface2:"#1a1a1a", text:"#f0f0f0", dim:"#aaa", muted:"#555",
  codeBg:"#0d0d0d", codeText:"#e8e8e8", lineNum:"#3a3a3a",
  outputBg:"#0a0a0a", outputText:"#4ade80", errorText:"#f87171", promptCol:"#444",
};
const LIGHT = {
  bg:"#f0f0f2", topbar:"#fff", border:"#d0d0d4", surface:"#fafafa",
  surface2:"#e8e8ea", text:"#111", dim:"#444", muted:"#999",
  codeBg:"#f7f7f8", codeText:"#1a1a2e", lineNum:"#bbb",
  outputBg:"#e8e8ec", outputText:"#166534", errorText:"#b91c1c", promptCol:"#888",
};

export default function CodeBox() {
  const [code,       setCode]       = useState("");
  const [output,     setOutput]     = useState("");
  const [language,   setLanguage]   = useState("python");
  const [running,    setRunning]    = useState(false);
  const [converting, setConverting] = useState(false);
  const [langOpen,   setLangOpen]   = useState(false);
  const [tmplOpen,   setTmplOpen]   = useState(false);
  const [helpOpen,   setHelpOpen]   = useState(false);
  const [outLines,   setOutLines]   = useState([]);
  const [blink,      setBlink]      = useState(true);
  const [dark,       setDark]       = useState(true);
  const [copied,     setCopied]     = useState(false);
  const [hasError,   setHasError]   = useState(false);
  const textareaRef  = useRef(null);

  const T    = dark ? DARK : LIGHT;
  const lang = LANGS.find(l => l.value === language);

  useEffect(() => {
    const id = setInterval(() => setBlink(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!output) { setOutLines([]); setHasError(false); return; }
    const isErr = /error|traceback|exception/i.test(output);
    setHasError(isErr);
    setOutLines([]);
    output.split("\n").forEach((ln, i) =>
      setTimeout(() => setOutLines(p => [...p, ln]), i * 35)
    );
  }, [output]);

  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); if (code.trim() && !running) handleRun(); }
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [code, running]);

  const closeAll = () => { setLangOpen(false); setTmplOpen(false); setHelpOpen(false); };

  const handleRun = async () => {
    setRunning(true); setOutput(""); setHasError(false);
    setOutLines([{ info:true, text:"▶  Executing…" }]);
    try {
      const r1 = await fetch(`${BACKEND}/compiler/compile/`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({code,language}) });
      const d1 = await r1.json();
      if (d1.output) { setOutput(d1.output); }
      else if (d1.code_id) {
        const r2 = await fetch(`${BACKEND}/compiler/compile/`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({code_id:d1.code_id,inputs:{}}) });
        const d2 = await r2.json();
        setOutput(d2.output || "No output returned.");
      } else { setOutput("Error: Server error — please try again."); }
    } catch { setOutput("Error: Connection failed. Backend may be waking up (~30s). Please retry."); }
    setRunning(false);
  };

  const handleConvert = async () => {
    setConverting(true); setOutput("");
    setOutLines([{ info:true, text:"⟳  Converting to pseudocode…" }]);
    try {
      const r = await fetch(`${BACKEND}/convert`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({language,code}) });
      const d = await r.json();
      setOutput(d.pseudocode || "No pseudocode generated.");
    } catch { setOutput("Error: Could not convert."); }
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

  // ── shared style helpers ─────────────────────────────
  const LBL = { fontSize:"13px", fontWeight:800, textTransform:"uppercase", letterSpacing:"1.5px", color:T.dim };

  const Spinner = ({ color }) => (
    <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:0.9,ease:"linear"}}
      style={{width:13,height:13,border:`2px solid ${color}`,borderTopColor:"transparent",borderRadius:"50%"}} />
  );

  const Kbd = ({ k }) => (
    <kbd style={{background:T.surface2,padding:"3px 8px",borderRadius:"5px",border:`1px solid ${T.border}`,fontFamily:"inherit",fontSize:"12px",color:T.dim,fontWeight:800}}>{k}</kbd>
  );

  // Dropdown — NO AnimatePresence, just display toggle to avoid flicker
  const DropMenu = ({ open, right, children }) =>
    open ? (
      <div onClick={e=>e.stopPropagation()}
        style={{position:"absolute",top:"calc(100% + 6px)",[right?"right":"left"]:0,background:T.topbar,border:`1px solid ${T.border}`,borderRadius:"12px",overflow:"hidden",zIndex:300,minWidth:"190px",boxShadow:dark?"0 16px 48px #00000099":"0 8px 32px #00000022"}}>
        {children}
      </div>
    ) : null;

  return (
    // KEY FIX: height:100vh + overflow:hidden = no page scroll
    <div style={{height:"100vh",overflow:"hidden",background:T.bg,display:"flex",flexDirection:"column",fontFamily:"'JetBrains Mono','Fira Code',monospace",color:T.text,transition:"background 0.25s,color 0.25s"}}
      onClick={closeAll}>

      {/* ══ TOPBAR ══════════════════════════════════════ */}
      <header style={{flexShrink:0,background:T.topbar,borderBottom:`1px solid ${T.border}`,padding:"0 20px",display:"flex",alignItems:"center",height:"50px",gap:"0"}}
        onClick={e=>e.stopPropagation()}>

        {/* left — window dots + breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:"16px",flex:"0 0 auto"}}>
          <div style={{display:"flex",gap:"7px"}}>
            {[["#ff5f57","✕"],["#febc2e","−"],["#28c840","+"]].map(([bg,sym],i)=>(
              <div key={i} style={{width:13,height:13,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",color:"transparent",fontWeight:900,transition:"color 0.12s",cursor:"default"}}
                onMouseEnter={e=>e.currentTarget.style.color="rgba(0,0,0,0.45)"}
                onMouseLeave={e=>e.currentTarget.style.color="transparent"}>{sym}</div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"13px",whiteSpace:"nowrap"}}>
            <FaCode size={12} style={{color:T.dim}}/>
            <span style={{color:T.dim,fontWeight:700}}>codebox</span>
            <span style={{color:T.muted}}>/</span>
            <span style={{color:lang.color,fontWeight:800}}>{language==="python"?"main.py":"main.c"}</span>
          </div>
        </div>

        {/* center — logo (absolute center) */}
        <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:"9px"}}>
          <div style={{width:30,height:30,borderRadius:"8px",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:900,color:"#fff",flexShrink:0}}>{"<>"}</div>
          <span style={{fontSize:"17px",fontWeight:900,letterSpacing:"-0.5px",color:T.text,whiteSpace:"nowrap"}}>Code<span style={{color:"#3b82f6"}}>Box</span></span>
        </div>

        {/* right controls */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"8px",flex:"0 0 auto"}}>
          <a href="https://github.com/YASHGUPTA11122004/CodeBox" target="_blank" rel="noreferrer"
            style={{display:"flex",alignItems:"center",gap:"6px",color:T.dim,fontSize:"13px",fontWeight:800,textDecoration:"none",padding:"6px 12px",borderRadius:"7px",border:`1px solid ${T.border}`,transition:"all 0.15s",whiteSpace:"nowrap"}}
            onMouseEnter={e=>{e.currentTarget.style.color=T.text;e.currentTarget.style.borderColor=T.dim;}}
            onMouseLeave={e=>{e.currentTarget.style.color=T.dim;e.currentTarget.style.borderColor=T.border;}}
          ><FaGithub size={13}/> Source</a>

          <button onClick={()=>setDark(!dark)}
            style={{display:"flex",alignItems:"center",gap:"7px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"5px 14px",cursor:"pointer",color:T.dim,fontSize:"13px",fontFamily:"inherit",fontWeight:800,transition:"all 0.15s",whiteSpace:"nowrap"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.dim}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}
          >
            <motion.div animate={{rotate:dark?0:180}} transition={{duration:0.35}}>
              {dark?<FaSun size={13} style={{color:"#f59e0b"}}/>:<FaMoon size={13} style={{color:"#8b5cf6"}}/>}
            </motion.div>
            {dark?"Light":"Dark"}
          </button>

          <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 7px #22c55e77"}}/>
            <span style={{fontSize:"12px",color:"#22c55e",fontWeight:900,letterSpacing:"1px"}}>LIVE</span>
          </div>
        </div>
      </header>

      {/* ══ TAB BAR ═════════════════════════════════════ */}
      <div style={{flexShrink:0,background:T.topbar,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 20px",gap:"4px"}}>
        <div style={{padding:"9px 18px",fontSize:"14px",fontWeight:900,color:lang.color,borderBottom:`2.5px solid ${lang.color}`,background:T.bg,borderRadius:"4px 4px 0 0"}}>
          {lang.icon} {language==="python"?"main.py":"main.c"}
        </div>
        <div style={{padding:"9px 18px",fontSize:"14px",fontWeight:700,color:T.muted}}>
          <FaTerminal size={11} style={{marginRight:6,verticalAlign:"middle"}}/>output
        </div>
      </div>

      {/* ══ MAIN SPLIT — flex:1 + overflow:hidden = fills remaining space ══ */}
      <div style={{flex:1,overflow:"hidden",display:"grid",gridTemplateColumns:"1fr 1fr"}}>

        {/* ── LEFT: Editor ─────────────────────────── */}
        <div style={{display:"flex",flexDirection:"column",borderRight:`1px solid ${T.border}`,overflow:"hidden"}}>

          {/* toolbar */}
          <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 16px",borderBottom:`1px solid ${T.border}`,background:T.surface}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{...LBL}}>Editor</span>
              <span style={{color:T.muted}}>·</span>
              <span style={{fontSize:"13px",color:T.dim,fontWeight:700}}>{lineCount} lines</span>
            </div>
            <div style={{display:"flex",gap:"8px"}}>

              {/* Templates */}
              <div style={{position:"relative"}}>
                <button
                  onClick={e=>{e.stopPropagation();setTmplOpen(o=>!o);setLangOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"7px",background:"none",border:`1px solid ${T.border}`,borderRadius:"7px",padding:"6px 12px",color:T.dim,fontSize:"13px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color=T.text;e.currentTarget.style.borderColor=T.dim;}}
                  onMouseLeave={e=>{e.currentTarget.style.color=T.dim;e.currentTarget.style.borderColor=T.border;}}
                >📋 Templates <FaChevronDown size={9}/></button>
                <DropMenu open={tmplOpen}>
                  <div style={{padding:"9px 14px 5px",fontSize:"11px",color:T.muted,fontWeight:900,textTransform:"uppercase",letterSpacing:"1px"}}>
                    {lang.icon} {lang.label} examples
                  </div>
                  {TEMPLATES[language].map((t,i)=>(
                    <div key={i} onClick={()=>loadTemplate(t)}
                      style={{padding:"10px 16px",fontSize:"14px",fontWeight:700,color:T.dim,cursor:"pointer",borderTop:`1px solid ${T.border}`,transition:"background 0.1s,color 0.1s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.color=lang.color;}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.dim;}}
                    >{t.label}</div>
                  ))}
                </DropMenu>
              </div>

              {/* Language */}
              <div style={{position:"relative"}}>
                <button
                  onClick={e=>{e.stopPropagation();setLangOpen(o=>!o);setTmplOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"7px",background:"none",border:`1px solid ${T.border}`,borderRadius:"7px",padding:"6px 12px",color:lang.color,fontSize:"13px",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}
                >{lang.icon} {lang.label} <FaChevronDown size={9} style={{color:T.dim}}/></button>
                <DropMenu open={langOpen} right>
                  {LANGS.map(l=>(
                    <div key={l.value} onClick={()=>{setLanguage(l.value);setLangOpen(false);setCode("");setOutput("");}}
                      style={{padding:"10px 16px",fontSize:"14px",fontWeight:700,color:language===l.value?l.color:T.dim,cursor:"pointer",display:"flex",gap:"10px",background:language===l.value?T.surface2:"transparent",transition:"background 0.1s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                      onMouseLeave={e=>e.currentTarget.style.background=language===l.value?T.surface2:"transparent"}
                    >{l.icon} {l.label}</div>
                  ))}
                </DropMenu>
              </div>
            </div>
          </div>

          {/* code area — flex:1 + overflow:hidden */}
          <div style={{flex:1,overflow:"hidden",display:"flex",background:T.codeBg}}>
            {/* line numbers */}
            <div style={{padding:"14px 10px",minWidth:"50px",textAlign:"right",color:T.lineNum,fontSize:"13px",lineHeight:"21.45px",userSelect:"none",borderRight:`1px solid ${T.border}`,fontFamily:"inherit",overflowY:"hidden",flexShrink:0}}>
              {Array.from({length:Math.max(lineCount,30)},(_,i)=>(
                <div key={i} style={{height:"21.45px"}}>{i+1}</div>
              ))}
            </div>
            {/* textarea fills remaining */}
            <textarea ref={textareaRef} value={code} onChange={e=>setCode(e.target.value)}
              placeholder={language==="python"?"# Write Python code here…\nprint('Hello, World!')":"// Write C code here…\n#include <stdio.h>\nint main() {\n    printf(\"Hello!\");\n    return 0;\n}"}
              style={{flex:1,background:T.codeBg,color:T.codeText,border:"none",outline:"none",resize:"none",padding:"14px 16px",fontSize:"13px",lineHeight:"1.65",fontFamily:"inherit",caretColor:lang.color,tabSize:4,overflowY:"auto"}}
              onKeyDown={e=>{
                if(e.key==="Tab"){e.preventDefault();const s=e.target.selectionStart,en=e.target.selectionEnd;setCode(code.substring(0,s)+"    "+code.substring(en));setTimeout(()=>e.target.setSelectionRange(s+4,s+4),0);}
              }}
            />
          </div>

          {/* action bar */}
          <div style={{flexShrink:0,padding:"10px 16px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:"9px"}}>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
              onClick={handleRun} disabled={running||!code.trim()}
              style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 22px",background:running?(dark?"#162016":"#dcfce7"):"linear-gradient(135deg,#16a34a,#15803d)",color:running?"#22c55e":"#fff",border:`1px solid ${running?"#22c55e33":"transparent"}`,borderRadius:"9px",fontSize:"14px",fontWeight:900,cursor:running||!code.trim()?"not-allowed":"pointer",fontFamily:"inherit",opacity:!code.trim()?0.5:1}}>
              {running?<Spinner color="#22c55e"/>:<FaPlay size={11}/>}
              {running?"Running…":"Run Code"}
            </motion.button>

            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
              onClick={handleConvert} disabled={converting||!code.trim()}
              style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 22px",background:converting?(dark?"#160f20":"#ede9fe"):"linear-gradient(135deg,#7c3aed,#6d28d9)",color:converting?"#8b5cf6":"#fff",border:`1px solid ${converting?"#8b5cf633":"transparent"}`,borderRadius:"9px",fontSize:"14px",fontWeight:900,cursor:converting||!code.trim()?"not-allowed":"pointer",fontFamily:"inherit",opacity:!code.trim()?0.5:1}}>
              {converting?<Spinner color="#8b5cf6"/>:<FaExchangeAlt size={11}/>}
              {converting?"Converting…":"→ Pseudocode"}
            </motion.button>

            {code.trim()&&(
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                onClick={()=>{setCode("");setOutput("");setOutLines([]);}}
                style={{padding:"10px 16px",background:"none",border:`1px solid ${T.border}`,borderRadius:"9px",fontSize:"13px",fontWeight:800,color:T.dim,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="#ef444466";}}
                onMouseLeave={e=>{e.currentTarget.style.color=T.dim;e.currentTarget.style.borderColor=T.border;}}
              >Clear</motion.button>
            )}
          </div>
        </div>

        {/* ── RIGHT: Output ────────────────────────── */}
        <div style={{display:"flex",flexDirection:"column",overflow:"hidden",background:T.outputBg}}>

          {/* output toolbar */}
          <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 16px",borderBottom:`1px solid ${T.border}`,background:T.surface}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <FaTerminal size={14} style={{color:hasError?T.errorText:T.dim}}/>
              <span style={{...LBL,color:hasError?T.errorText:T.dim}}>
                {hasError?"⚠ Error Detected":"Output Terminal"}
              </span>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              {output&&(
                <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.95}} onClick={handleCopy}
                  style={{display:"flex",alignItems:"center",gap:"6px",background:"none",border:`1px solid ${copied?"#22c55e44":T.border}`,borderRadius:"7px",color:copied?"#22c55e":T.dim,fontSize:"13px",fontWeight:800,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
                  onMouseEnter={e=>{if(!copied){e.currentTarget.style.color=T.text;e.currentTarget.style.borderColor=T.dim;}}}
                  onMouseLeave={e=>{if(!copied){e.currentTarget.style.color=T.dim;e.currentTarget.style.borderColor=T.border;}}}
                >{copied?<FaCheck size={11}/>:<FaCopy size={11}/>} {copied?"Copied!":"Copy"}</motion.button>
              )}
              {(output||outLines.length>0)&&(
                <button
                  onClick={()=>{setOutput("");setOutLines([]);setHasError(false);}}
                  style={{background:"none",border:`1px solid ${T.border}`,borderRadius:"7px",color:T.dim,fontSize:"13px",fontWeight:800,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color=T.text;e.currentTarget.style.borderColor=T.dim;}}
                  onMouseLeave={e=>{e.currentTarget.style.color=T.dim;e.currentTarget.style.borderColor=T.border;}}
                >Clear</button>
              )}
            </div>
          </div>

          {/* terminal body — flex:1 + overflowY:auto = scrolls only inside */}
          <div style={{flex:1,overflowY:"auto",padding:"20px",fontFamily:"inherit",fontSize:"14px",lineHeight:"1.8"}}>
            {outLines.length===0?(
              <div>
                <div style={{color:T.promptCol,marginBottom:"6px",fontWeight:700,fontSize:"13px"}}>$ codebox --ready</div>
                <div style={{color:dark?"#1d3a1d":"#4ade8077",fontWeight:700}}>▶ Write code or pick a template, then hit Run…</div>
              </div>
            ):(
              <div>
                <div style={{color:T.promptCol,marginBottom:"12px",fontSize:"13px",fontWeight:700}}>
                  $ codebox --run {language==="python"?"main.py":"main.c"}
                </div>
                {outLines.map((ln,i)=>(
                  <motion.div key={i} initial={{opacity:0,x:-3}} animate={{opacity:1,x:0}} transition={{duration:0.08}}
                    style={{color:ln.info?(dark?"#3b82f6":"#1d4ed8"):(hasError?T.errorText:T.outputText),whiteSpace:"pre-wrap",wordBreak:"break-all",fontWeight:700}}>
                    {ln.info?ln.text:ln}
                  </motion.div>
                ))}
                {!hasError&&<span style={{display:"inline-block",width:8,height:16,background:T.outputText,opacity:blink?1:0,marginLeft:2,verticalAlign:"middle"}}/>}
              </div>
            )}
          </div>

          {/* status bar + ? help button */}
          <div style={{flexShrink:0,padding:"7px 16px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:"12px",fontSize:"13px",color:T.dim,fontWeight:700}}>
            <span style={{color:lang.color,fontWeight:800}}>{lang.icon} {lang.label}</span>
            <span style={{color:T.muted}}>·</span>
            <span>{lineCount} lines</span>
            <span style={{color:T.muted}}>·</span>
            <span>{code.length} chars</span>
            <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"12px"}}>
              <span>
                {running    ?<span style={{color:"#22c55e",fontWeight:800}}>● Running</span>
                :converting ?<span style={{color:"#8b5cf6",fontWeight:800}}>● Converting</span>
                :hasError   ?<span style={{color:T.errorText,fontWeight:800}}>✕ Error</span>
                :output     ?<span style={{color:"#22c55e",fontWeight:800}}>✓ Done</span>
                :            <span style={{color:T.muted}}>○ Ready</span>}
              </span>

              {/* ? help button — in status bar, no floating */}
              <div style={{position:"relative"}}>
                {helpOpen&&(
                  <div onClick={e=>e.stopPropagation()}
                    style={{position:"absolute",bottom:"36px",right:0,background:T.topbar,border:`1px solid ${T.border}`,borderRadius:"14px",padding:"16px 18px",minWidth:"255px",boxShadow:dark?"0 16px 48px #00000099":"0 8px 32px #00000022",zIndex:200}}>
                    <div style={{fontSize:"11px",color:T.muted,fontWeight:900,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:"12px",display:"flex",alignItems:"center",gap:"7px"}}>
                      <FaKeyboard size={11}/> Keyboard Shortcuts
                    </div>
                    {SHORTCUTS.map((s,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderTop:i>0?`1px solid ${T.border}`:"none"}}>
                        <span style={{fontSize:"13px",color:T.dim,fontWeight:700}}>{s.desc}</span>
                        <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
                          {s.keys.map((k,j)=>(
                            <span key={j} style={{display:"flex",alignItems:"center",gap:"3px"}}>
                              <Kbd k={k}/>
                              {j<s.keys.length-1&&<span style={{color:T.muted,fontSize:"10px"}}>+</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={e=>{e.stopPropagation();setHelpOpen(o=>!o);}}
                  style={{width:26,height:26,borderRadius:"50%",background:helpOpen?"linear-gradient(135deg,#3b82f6,#8b5cf6)":T.surface2,border:`1px solid ${helpOpen?"transparent":T.border}`,color:helpOpen?"#fff":T.dim,fontSize:"13px",fontWeight:900,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}
                >?</button>
              </div>
            </span>
          </div>
        </div>
      </div>

      {/* ══ FOOTER ══════════════════════════════════════ */}
      <footer style={{flexShrink:0,background:T.topbar,borderTop:`1px solid ${T.border}`,padding:"11px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"12px",color:T.dim,fontWeight:700}}>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <span style={{color:T.muted}}>Built by</span>
          <a href="https://linkedin.com/in/yashgupta11122004" target="_blank" rel="noreferrer"
            style={{color:"#3b82f6",textDecoration:"none",fontWeight:900,fontSize:"13px"}}>Yash Gupta</a>
          <span style={{color:T.muted}}>·</span>
          <span>B.Tech CSE @ GEHU</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <span style={{color:"#3b82f6",fontWeight:900}}>{"<>"}</span>
          <span style={{fontWeight:800}}>CodeBox</span>
          <span style={{color:T.muted}}>·</span>
          <span>Python & C Compiler</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <a href="https://github.com/YASHGUPTA11122004/CodeBox" target="_blank" rel="noreferrer"
            style={{color:T.dim,textDecoration:"none",display:"flex",alignItems:"center",gap:"5px",fontWeight:800}}
            onMouseEnter={e=>e.currentTarget.style.color=T.text}
            onMouseLeave={e=>e.currentTarget.style.color=T.dim}
          ><FaGithub size={12}/> GitHub</a>
          <span style={{color:T.muted}}>·</span>
          <a href="https://portfolio-sdab.vercel.app" target="_blank" rel="noreferrer"
            style={{color:T.dim,textDecoration:"none",fontWeight:800}}
            onMouseEnter={e=>e.currentTarget.style.color=T.text}
            onMouseLeave={e=>e.currentTarget.style.color=T.dim}
          >Portfolio →</a>
        </div>
      </footer>
    </div>
  );
}
