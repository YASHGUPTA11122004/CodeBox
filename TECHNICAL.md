# 🗂️ TECHNICAL.md — CodeBox

> **Purpose:** Yeh file kisi bhi AI (ChatGPT, Claude, Gemini, etc.) ko CodeBox ka poora context dene ke liye hai.  
> **Usage:** Kisi AI ko changes karwane ke liye yeh file + relevant code file paste karo aur kaho kya change karna hai.

---

## 📁 Project Structure

```
CodeBox/                          ← GitHub: YASHGUPTA11122004/CodeBox
├── backend/
│   ├── backend/
│   │   ├── settings.py           ← Django settings (CORS, INSTALLED_APPS)
│   │   ├── urls.py               ← Root URL config
│   │   └── wsgi.py               ← WSGI entry point
│   ├── compiler/
│   │   ├── views.py              ← POST/PUT API — compile & execute code
│   │   ├── compiler.py           ← run_code() — actual execution logic
│   │   └── urls.py               ← /compiler/compile/ route
│   ├── converters/
│   │   ├── c_to_pseudo.py        ← C → Pseudocode (AST based, pycparser)
│   │   └── python_to_pseudo.py   ← Python → Pseudocode (AST based)
│   ├── main.py                   ← FastAPI app for /convert endpoint
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── components/
        │   └── CodeBox.jsx       ← POORA UI (single file, ~400 lines)
        ├── App.jsx               ← React Router setup
        └── main.jsx              ← Vite entry point
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 |
| Styling | Inline CSS + Framer Motion |
| Backend | Django 6 + Django REST Framework |
| Converter | FastAPI (separate service) |
| Execution | Python subprocess + gcc |
| Frontend Deploy | Vercel |
| Backend Deploy | Render (free tier, cold start ~30s) |

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://codebox-rho.vercel.app |
| Backend | https://codebox-895s.onrender.com |

---

## ⚙️ How It Works — Request Flow

```
User types code → clicks Run
    ↓
Frontend (CodeBox.jsx)
    POST /compiler/compile/ → { code, language }
    ↓
Backend (views.py → compiler.py)
    - No placeholders? → run_code() immediately → return { output }
    - Has {{placeholders}}? → store code → return { code_id }
    ↓
If code_id received:
    PUT /compiler/compile/ → { code_id, inputs: {} }
    → replace placeholders → run_code() → return { output }
    ↓
Frontend displays output in terminal
```

```
User clicks → Pseudocode
    ↓
Frontend POST /convert → { code, language }
    ↓
FastAPI (main.py)
    → python_to_pseudo.py OR c_to_pseudo.py
    → AST parse → generate pseudocode
    → return { pseudocode }
```

---

## 📄 File-by-File Code Reference

---

### 1. `backend/compiler/compiler.py` — Code Execution Engine

```python
import subprocess
import os
import uuid

def run_code(language, code):
    filename = f"temp_{uuid.uuid4()}"
    try:
        if language == 'python':
            file = f"{filename}.py"
            with open(file, 'w') as f:
                f.write(code)
            result = subprocess.run(['python', file], capture_output=True, text=True, timeout=5)

        elif language == 'c':
            c_file = f"{filename}.c"
            exe_file = f"{filename}.exe"
            with open(c_file, 'w') as f:
                f.write(code)
            compile_result = subprocess.run(['gcc', c_file, '-o', exe_file], capture_output=True, text=True)
            if compile_result.returncode != 0:
                return compile_result.stderr
            result = subprocess.run([f"./{exe_file}"], capture_output=True, text=True, timeout=5)

        elif language == 'java':
            # Java support exists but not exposed in frontend yet
            java_file = f"{filename}.java"
            class_name = filename
            with open(java_file, 'w') as f:
                f.write(code.replace('class Main', f'class {class_name}'))
            compile_result = subprocess.run(['javac', java_file], capture_output=True, text=True)
            if compile_result.returncode != 0:
                return compile_result.stderr
            result = subprocess.run(['java', class_name], capture_output=True, text=True, timeout=5)

        else:
            return "Unsupported Language"

        output = result.stdout
        error = result.stderr
        return output if output else error

    except Exception as e:
        return str(e)

    finally:
        for ext in ['.py', '.c', '.exe', '.class', '.java']:
            if os.path.exists(f"{filename}{ext}"):
                os.remove(f"{filename}{ext}")
```

**Key points:**
- Unique `uuid` filename har run ke liye — concurrent requests conflict nahi karte
- `timeout=5` — infinite loop se protection
- `finally` block — temp files hamesha clean up hoti hain
- Java backend mein hai par frontend mein abhi expose nahi hua

---

### 2. `backend/compiler/views.py` — REST API View

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from .compiler import run_code
import uuid
import re

class CompileCodeView(APIView):
    code_storage = {}  # In-memory storage (class variable)

    def post(self, request):
        code = request.data.get('code', '')
        language = request.data.get('language', '').lower()

        if not code or not language:
            return Response({'error': 'Code and Language are required fields.'}, status=400)

        code_id = str(uuid.uuid4())
        CompileCodeView.code_storage[code_id] = {'code': code, 'language': language}

        if not re.search(r"\{\{.*?\}\}", code):
            # No {{placeholders}} → run immediately
            output = run_code(language, code)
            return Response({'output': output, 'code_id': code_id})

        # Has placeholders → wait for PUT with inputs
        return Response({'message': 'Waiting for inputs...', 'code_id': code_id})

    def put(self, request):
        code_id = request.data.get('code_id', '')
        new_inputs = request.data.get('inputs', {})

        if code_id not in CompileCodeView.code_storage:
            return Response({'error': 'Invalid Code ID.'}, status=404)

        saved_code = CompileCodeView.code_storage[code_id]['code']
        language = CompileCodeView.code_storage[code_id]['language']

        for placeholder, value in new_inputs.items():
            saved_code = saved_code.replace(f"{{{{{placeholder}}}}}", str(value))

        output = run_code(language, saved_code)
        return Response({'output': output})
```

**Key points:**
- `code_storage` class variable hai — server restart pe clear ho jaata hai
- Placeholder system: `{{variable_name}}` in code → PUT se replace hota hai
- Frontend abhi `inputs: {}` bhejta hai (empty) — placeholder feature future use ke liye

---

### 3. `backend/compiler/urls.py`

```python
from django.urls import path
from .views import CompileCodeView

urlpatterns = [
    path('compile/', CompileCodeView.as_view(), name='compile-code'),
]
```

---

### 4. `backend/backend/urls.py` — Root URLs

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('compiler/', include('compiler.urls')),
]
```

**Note:** `/convert` endpoint FastAPI mein hai — `main.py` mein define hoga alag se.

---

### 5. `backend/backend/settings.py` — Key Settings

```python
ALLOWED_HOSTS = ['*']  # Production mein specific domain daalna chahiye

INSTALLED_APPS = [
    # ... default apps ...
    'corsheaders',        # CORS ke liye
    'rest_framework',     # DRF
    'compiler',           # Hamara app
]

MIDDLEWARE = [
    # ...
    'corsheaders.middleware.CorsMiddleware',  # CORS middleware
    # ...
]

CORS_ALLOW_ALL_ORIGINS = True  # Sab origins allow hain

# Database: SQLite (local dev)
# Production mein bhi SQLite use ho raha hai (Render)
```

---

### 6. `backend/converters/python_to_pseudo.py` — Python AST → Pseudocode

```python
import ast

class PseudoCodeGenerator(ast.NodeVisitor):
    # AST visitor — Python code ko parse karke pseudocode generate karta hai
    # Handles: FunctionDef, Assign, If/Else, For, While, Return, print(), input()
    
    def visit_FunctionDef(self, node):   # def func():  →  Function func() Begin...End
    def visit_Assign(self, node):        # x = 5       →  Set x to 5
    def visit_If(self, node):            # if/else     →  If...Begin...End If
    def visit_For(self, node):           # for/range   →  For i from 0 to N
    def visit_While(self, node):         # while       →  While...Begin...End While
    def visit_Return(self, node):        # return      →  Return value
    def visit_Call(self, node):          # print()     →  Display args
                                         # input()     →  Get input
                                         # other()     →  Call func(args)
```

---

### 7. `backend/converters/c_to_pseudo.py` — C AST → Pseudocode

```python
# pycparser library use karta hai C code ko AST mein parse karne ke liye
# Handles: FuncDef, Decl, Assignment, If, For, While, Return, printf()

# Important: #include lines ko pehle strip karta hai (clean_c_code())
# kyunki pycparser standard headers parse nahi kar sakta
```

---

### 8. `frontend/src/App.jsx` — React Router

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CodeBox from "./components/CodeBox";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CodeBox />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Note:** Sirf ek route hai — `/` → CodeBox. Future mein naye pages add karne ke liye yahan naya `<Route>` add karo.

---

### 9. `frontend/src/components/CodeBox.jsx` — Main UI Component

**~400 lines ka single component. Sab kuch yahi hai.**

#### State variables:
```js
code        // Editor mein typed code
output      // Terminal output string
language    // "python" | "c"
running     // boolean — run button loading state
converting  // boolean — pseudocode button loading state
langOpen    // boolean — language dropdown open/close
tmplOpen    // boolean — templates dropdown open/close
helpOpen    // boolean — ? shortcuts popup
outLines    // array — output lines (for streaming effect)
blink       // boolean — cursor blink effect
dark        // boolean — theme toggle
copied      // boolean — copy button feedback
hasError    // boolean — error detection in output
```

#### Theme system:
```js
const DARK = { bg, topbar, border, surface, surface2, text, dim, muted,
               codeBg, codeText, lineNum, outputBg, outputText, errorText, promptCol }
const LIGHT = { ... }  // Same keys, different values
const T = dark ? DARK : LIGHT  // T.bg, T.text, etc. everywhere
```

#### Key functions:
```js
handleRun()      // POST /compiler/compile/ → stream output lines
handleConvert()  // POST /convert → get pseudocode
handleCopy()     // Copy output to clipboard
loadTemplate(t)  // Set code from template, focus textarea
closeAll()       // Close all dropdowns
```

#### Layout structure:
```
<div height:100vh overflow:hidden>        ← NO page scroll
  <header>                                ← Topbar (52px)
  <div>                                   ← Tab bar
  <div display:grid gridTemplateColumns:1fr 1fr>   ← Main split
    <div>                                 ← LEFT: Editor
      toolbar (Templates + Language dropdowns)
      code area (line numbers + textarea)
      action bar (Run + Pseudocode + Clear buttons)
    </div>
    <div>                                 ← RIGHT: Output
      output toolbar (Copy + Clear)
      terminal body (streaming output)
      status bar + ? help button
    </div>
  </div>
  <footer>                                ← Footer (Built by Yash Gupta)
</div>
```

#### API calls in CodeBox.jsx:
```js
const BACKEND = "https://codebox-895s.onrender.com"  // ← Change karo local dev ke liye

// Run code:
POST ${BACKEND}/compiler/compile/
Body: { code, language }
Response: { output } OR { code_id }

// If code_id received (placeholder case):
PUT ${BACKEND}/compiler/compile/
Body: { code_id, inputs: {} }
Response: { output }

// Pseudocode:
POST ${BACKEND}/convert
Body: { language, code }
Response: { pseudocode }
```

---

## 🔧 Common Changes — Kahan Kya Karna Hai

| Change | File | Search karo |
|--------|------|-------------|
| Backend URL change | `CodeBox.jsx` | `const BACKEND =` |
| Naya language add karo | `CodeBox.jsx` | `const LANGS = [` |
| Template add/edit karo | `CodeBox.jsx` | `const TEMPLATES = {` |
| Dark theme colors | `CodeBox.jsx` | `const DARK = {` |
| Light theme colors | `CodeBox.jsx` | `const LIGHT = {` |
| Naya API endpoint | `backend/backend/urls.py` | `urlpatterns` |
| Code execution logic | `backend/compiler/compiler.py` | `def run_code` |
| Python pseudocode improve | `backend/converters/python_to_pseudo.py` | `class PseudoCodeGenerator` |
| C pseudocode improve | `backend/converters/c_to_pseudo.py` | `class CCodeVisitor` |
| Naya route add karo | `frontend/src/App.jsx` | `<Routes>` |
| CORS settings | `backend/backend/settings.py` | `CORS_ALLOW_ALL_ORIGINS` |

---

## 🚀 Future Features (Planned)

- [ ] Java language support (backend ready, frontend mein add karna hai)
- [ ] JavaScript support
- [ ] Input field — user se runtime input le sake
- [ ] Code save/share feature
- [ ] Syntax highlighting
- [ ] Font size control

---

## ⚠️ Known Issues / Limitations

1. **Cold start:** Render free tier pe backend ~30s cold start hota hai
2. **In-memory storage:** `code_storage` server restart pe clear ho jaata hai — persistent DB nahi hai
3. **No auth:** Koi bhi API call kar sakta hai — rate limiting nahi hai
4. **Timeout 5s:** 5 second se zyada chalane wale programs timeout ho jaate hain
5. **ALLOWED_HOSTS = `*`:** Production mein specific domain honi chahiye

---

## 🧑‍💻 Author

**Yash Gupta** — B.Tech CSE, GEHU Bhimtal (2022–2026)

| Platform | Link |
|----------|------|
| GitHub | github.com/YASHGUPTA11122004 |
| LinkedIn | linkedin.com/in/yashgupta11122004 |
| Portfolio | portfolio-sdab.vercel.app |
| Email | yashgupta11122004@gmail.com |

---

## 💡 AI Ko Context Dene Ka Tarika if somebody wants my project

Kisi bhi AI se changes karwane ke liye:

```
"Mera CodeBox project hai — full-stack online compiler.
TECHNICAL.md padho context ke liye.

[Relevant file ka code paste karo]

Mujhe [YEH CHANGE] karni hai..."
```

**Example:**
```
"Mera CodeBox project hai.
TECHNICAL.md: [paste karo]
CodeBox.jsx: [paste karo]
Mujhe JavaScript language support add karni hai frontend mein."
```

---

*Last updated: March 2026*
