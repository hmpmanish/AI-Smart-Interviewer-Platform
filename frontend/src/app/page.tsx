'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Send, Mic, Bot, User, Code2, MessageSquare, LogOut, Loader2 } from 'lucide-react';
import CodeWhiteboard from '@/components/CodeWhiteboard';
import Scorecard from '@/components/Scorecard';
import { AnimatePresence, motion } from 'framer-motion';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat');
  const [showScorecard, setShowScorecard] = useState(false);
  
  // Real-time states
  const [focusScore, setFocusScore] = useState(100);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hello! I'm your AI Interviewer. Please upload your resume to start!" }
  ]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Webcam & WebSocket
  useEffect(() => {
    // 1. Start Webcam
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Error accessing webcam:", err));

    // 2. Connect WebSocket
    wsRef.current = new WebSocket("ws://localhost:8000/ws/video");
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.score !== undefined) {
        setFocusScore(data.score);
      }
    };

    // 3. Send Frames
    const interval = setInterval(() => {
      if (videoRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const base64Frame = canvas.toDataURL("image/jpeg", 0.5); 
          wsRef.current.send(base64Frame);
        }
      }
    }, 500);

    return () => {
      clearInterval(interval);
      wsRef.current?.close();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessages(prev => [...prev, { sender: 'user', text: `Uploaded: ${file.name}` }]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload-resume", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      setMessages(prev => [
        ...prev, 
        { sender: 'bot', text: `Thanks! I've analyzed your resume. Let's start with this question: ${data.questions[0]}` }
      ]);
    } catch (error) {
      console.error("Error uploading resume:", error);
      setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I had trouble reading that PDF. Could you try again?" }]);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    // @ts-ignore - Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInputText(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <AnimatePresence mode="wait">
      {showScorecard ? (
        <Scorecard key="scorecard" onBack={() => setShowScorecard(false)} />
      ) : (
        <motion.div 
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto"
        >
          {/* Header */}
      <header className="flex justify-between items-center mb-8 glass-panel px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-xl">
            <Bot className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Nexus<span className="text-gradient">AI</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowScorecard(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium border border-red-500/30"
          >
            <LogOut className="w-5 h-5" />
            <span>End Interview</span>
          </button>
          
          <input 
            type="file" 
            accept=".pdf" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="glass-button flex items-center gap-2 px-6 py-3 group"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />}
            <span>{isUploading ? 'Analyzing...' : 'Upload Resume (PDF)'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Video Feed & Analysis (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-col h-[600px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                Live Interview Feed
              </h2>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-sm text-slate-300 font-medium tracking-wider">REC</span>
              </div>
            </div>

            <div className="flex-1 glass-inner flex flex-col items-center justify-center relative group">
              {/* Decorative corners */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-indigo-500/30 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-indigo-500/30 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-indigo-500/30 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-indigo-500/30 rounded-br-lg"></div>
              
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 mix-blend-overlay pointer-events-none"
              />
              
              <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500 z-10">
                <User className="w-10 h-10 text-indigo-300" />
              </div>
              <p className="text-slate-400 font-medium z-10 tracking-widest">ANALYZING</p>
              
              {/* Simulated focus tracking overlay */}
              <div className="absolute bottom-6 right-6 glass-inner px-4 py-2 flex items-center gap-3 border-green-500/30 z-10">
                <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.8)] ${focusScore > 70 ? 'bg-green-400' : 'bg-red-500'}`}></div>
                <span className="text-sm text-green-100">Focus: {focusScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chat & Code Interface (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[600px]">
          <div className="glass-panel p-6 flex flex-col h-full relative">
            
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-[2px]">
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-indigo-400" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <div>
                  <h2 className="text-md font-bold text-white">AI Interviewer</h2>
                  <p className="text-xs text-indigo-300">Technical Assessment</p>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex bg-black/20 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-indigo-500/80 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
                <button 
                  onClick={() => setActiveTab('code')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'code' ? 'bg-indigo-500/80 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <Code2 className="w-4 h-4" />
                  Code
                </button>
              </div>
            </div>

            {/* Dynamic Content based on Tab */}
            {activeTab === 'chat' ? (
              <>
                <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2">
                  <div className="flex justify-center">
                    <span className="text-xs font-medium px-3 py-1 glass-inner text-slate-400 rounded-full">
                      Interview Session Started
                    </span>
                  </div>

                  {/* AI Message */}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center border border-indigo-500/30">
                        {msg.sender === 'bot' ? <Bot className="w-5 h-5 text-indigo-300" /> : <User className="w-5 h-5 text-indigo-300" />}
                      </div>
                      <div className={`bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-slate-200 text-sm leading-relaxed max-w-[85%] relative ${msg.sender === 'bot' ? 'rounded-tl-sm' : 'rounded-tr-sm bg-purple-500/20'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto relative">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your response..." 
                    className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-400 rounded-2xl py-4 pl-4 pr-32 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                  <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                    <button 
                      onClick={toggleRecording}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 h-full pb-2">
                <CodeWhiteboard />
              </div>
            )}
          </div>
        </div>
        
      </main>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
