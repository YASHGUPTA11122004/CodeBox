import { useState } from "react";
import { motion } from "framer-motion";
import { FaPlay, FaExchangeAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function CodeBox() {
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("python");

  const navigate = useNavigate();

  const handleRun = async () => {
    setOutput(`Running ${language} code...`);
    try {
      const postResponse = await fetch("https://codebox-895s.onrender.com/compiler/compile/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const postData = await postResponse.json();

      if (postData.output) {
        setOutput(postData.output);
      } else if (postData.code_id) {
        let inputObj = {};
        try {
          inputObj = JSON.parse(input);
        } catch (e) {
          setOutput("Invalid input format. Use JSON like {\"input1\": \"5\"}");
          return;
        }

        const putResponse = await fetch("https://codebox-895s.onrender.com/compiler/compile/", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code_id: postData.code_id, inputs: inputObj }),
        });

        const putData = await putResponse.json();
        setOutput(putData.output || "No output returned.");
      } else {
        setOutput("Bhai kuch  server response eeror aara hai.");
      }
    } catch (err) {
      console.error(err);
      setOutput("An error occurred while compiling the code.");
    }
  };

  const handleConvert = async () => {
    setOutput("Change kr rha hu bhai.....");
    try {
      const res = await fetch("https://codebox-895s.onrender.com/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await res.json();
      setOutput(data.pseudocode || "No pseudocode generated.");
    } catch (err) {
      setOutput("Error converting code.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f5f7fa] to-[#c3cfe2] text-gray-800 p-6">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-6">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-blue-700"
        >
          PyBox
        </motion.h1>
      </div>

      {/* Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Code Editor Section */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label className="font-semibold">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="p-2 rounded bg-white border border-gray-300"
            >
              <option value="python">Python</option>
              <option value="c">C</option>
            </select>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="# Write your code here..."
            className="h-96 bg-black text-green-300 p-4 rounded font-mono text-sm"
          />
          
          <div className="flex gap-4 mt-2">
            <button
              onClick={handleRun}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <FaPlay /> Run
            </button>
            <button
              onClick={handleConvert}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <FaExchangeAlt /> Convert
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-white p-6 rounded shadow-lg flex flex-col">
          <h2 className="text-lg font-bold mb-2 text-gray-700">Output</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded h-full overflow-auto font-mono text-sm whitespace-pre-wrap">
            {output || "No output yet."}
          </div>
        </div>
      </div>
    </div>
  );
}
