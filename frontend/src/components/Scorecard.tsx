'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Award, Target, ChevronLeft } from 'lucide-react';

interface ScorecardProps {
  onBack: () => void;
}

export default function Scorecard({ onBack }: ScorecardProps) {
  const [interviewScore, setInterviewScore] = useState(0);
  const [focusScore, setFocusScore] = useState(0);
  
  const finalInterviewScore = 88;
  const finalFocusScore = 95;

  useEffect(() => {
    // Simple counter animation
    const duration = 2000;
    const steps = 60;
    const stepTime = Math.abs(Math.floor(duration / steps));
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setInterviewScore(Math.floor((finalInterviewScore / steps) * currentStep));
      setFocusScore(Math.floor((finalFocusScore / steps) * currentStep));
      
      if (currentStep >= steps) {
        setInterviewScore(finalInterviewScore);
        setFocusScore(finalFocusScore);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  const CircularProgress = ({ score, label, color }: { score: number, label: string, color: string }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/10"
            />
            {/* Progress circle */}
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 2, ease: "easeOut" }}
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeLinecap="round"
              className={color}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">{score}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>
        <span className="mt-4 text-lg font-medium text-slate-200">{label}</span>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-panel p-8 md:p-12 max-w-4xl mx-auto mt-8 w-full"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Interview Results</h1>
        <p className="text-slate-400 text-lg">Here is a comprehensive breakdown of your performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div className="flex justify-center glass-inner p-8">
          <CircularProgress 
            score={interviewScore} 
            label="Overall Score" 
            color="text-indigo-400"
          />
        </div>
        <div className="flex justify-center glass-inner p-8">
          <CircularProgress 
            score={focusScore} 
            label="Focus Score" 
            color="text-emerald-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-inner p-6 border-t-4 border-emerald-500/50"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-400" />
            What You Did Well
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Excellent understanding of React state management and hooks lifecycle.</span>
            </li>
            <li className="flex gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Clear and concise communication of complex technical concepts.</span>
            </li>
            <li className="flex gap-3 text-slate-300">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Maintained high focus and eye contact throughout the interview.</span>
            </li>
          </ul>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-inner p-6 border-t-4 border-amber-500/50"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-400" />
            Areas for Improvement
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-3 text-slate-300">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>Could optimize the sorting algorithm used in the coding challenge for O(N log N) time complexity.</span>
            </li>
            <li className="flex gap-3 text-slate-300">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>Consider detailing testing strategies (e.g., Jest/RTL) when discussing project architecture.</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}
