'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: Date;
}

export default function CopilotBubble() {
  const { token, theme } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: "Hello! I'm your AI Parking Copilot. I can analyze parking violations and recommend traffic clearance deployments. Ask me:\n- *Which area needs action right now?*\n- *Which hotspots are growing fastest?*\n- *Where should officers go tomorrow?*",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userText = inputText;
    setInputText('');
    setLoading(true);

    // Append user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userText }),
      });

      if (res.ok) {
        const data = await res.json();
        const copilotMsg: Message = {
          id: Math.random().toString(),
          sender: 'copilot',
          text: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, copilotMsg]);
      } else {
        throw new Error('Failed response');
      }
    } catch (error) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'copilot',
        text: 'Sorry, I encountered an error connecting to the model server. Please verify the backend is online.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestQuery = (query: string) => {
    setInputText(query);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            className={`absolute bottom-16 right-0 w-[360px] sm:w-[400px] h-[500px] rounded-3xl border flex flex-col overflow-hidden backdrop-blur-xl ${
              isDark ? 'glass-card-dark text-slate-100' : 'glass-card-light text-slate-900 bg-white/95'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/20">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
                  <Bot size={16} />
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-cyan-300">AI Parking Copilot</span>
                  <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Telemetry Agent Online
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-full hover:bg-white/10 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-5 whitespace-pre-line ${
                      m.sender === 'user'
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : isDark
                          ? 'border border-white/5 bg-slate-900/40 text-slate-300'
                          : 'border border-slate-200 bg-slate-100 text-slate-800'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className={`rounded-2xl px-4 py-3 text-xs flex items-center gap-2 ${isDark ? 'bg-slate-900/40 border border-white/5' : 'bg-slate-100 border border-slate-200'}`}>
                    <Loader2 size={14} className="animate-spin text-cyan-400" />
                    <span className="text-slate-500 font-medium">Copilot is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions shortcuts */}
            {messages.length === 1 && (
              <div className="px-5 py-2.5 flex flex-wrap gap-2 border-t border-white/5">
                {[
                  "Which area needs action?",
                  "Where should officers go tomorrow?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => suggestQuery(q)}
                    className={`text-[9px] font-bold border rounded-full px-2.5 py-1 transition flex items-center gap-1 ${
                      isDark ? 'border-white/10 hover:border-cyan-400/30 hover:bg-cyan-400/5 text-slate-400 hover:text-cyan-300' : 'border-slate-200 hover:border-cyan-500 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700'
                    }`}
                  >
                    {q} <ArrowRight size={10} />
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-slate-950/10 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask me a question..."
                className={`flex-1 rounded-2xl border px-4 py-2.5 text-xs ${
                  isDark ? 'border-white/10 bg-slate-900/60 text-slate-200 focus:border-cyan-400/30' : 'border-slate-200 bg-white text-slate-950 focus:border-cyan-500'
                }`}
              />
              <button
                type="submit"
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500 text-slate-950 transition hover:bg-cyan-400 hover:scale-[1.03] active:scale-[0.97]"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-2xl shadow-cyan-500/30 transition hover:bg-cyan-400 border border-cyan-400/25 relative"
        aria-label="Toggle copilot panel"
      >
        {isOpen ? <X size={20} /> : <Bot size={20} />}
        {!isOpen && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 text-[8px] font-bold text-slate-950 items-center justify-center">
              AI
            </span>
          </span>
        )}
      </motion.button>
    </div>
  );
}
