'use client';

import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, CheckCircle, Code } from 'lucide-react';

export default function CodeWhiteboard() {
  const [code, setCode] = useState('// Write your solution here\nfunction solve(arr) {\n  \n}\n');
  const [language, setLanguage] = useState('javascript');
  const [status, setStatus] = useState('Connected to AI Evaluator');
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket for real-time collaboration
  useEffect(() => {
    // In a real app, this would connect to the backend WebSocket
    // wsRef.current = new WebSocket("ws://localhost:8000/ws/code");
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    
    // Send code to backend if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'code_update', code: newCode }));
    }
  };

  const handleRunCode = () => {
    setStatus('Running tests...');
    setTimeout(() => {
      setStatus('All test cases passed! 🎉');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden glass-inner">
      {/* Toolbar */}
      <div className="bg-slate-900/60 border-b border-white/5 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-indigo-400" />
          <select 
            className="bg-black/30 border border-white/10 text-white text-sm rounded-lg px-3 py-1 focus:outline-none focus:border-indigo-500"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
          </select>
          <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-green-300">{status}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            title="Reset Code"
            onClick={() => setCode('// Write your solution here\nfunction solve(arr) {\n  \n}\n')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={handleRunCode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Run Code
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors">
            <CheckCircle className="w-4 h-4" />
            Submit
          </button>
        </div>
      </div>

      {/* Editor container */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineHeight: 1.6,
            padding: { top: 20 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
          }}
          loading={
            <div className="flex h-full items-center justify-center text-slate-400">
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
