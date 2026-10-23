"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  X, 
  Minus, 
  Maximize2,
  Brain,
  MessageSquare,
  Zap,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { clsx } from "clsx";

export default function AIAssistantOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "Hello! I'm your SabaHub AI assistant. I can help you write posts, find jobs, or optimize your profile. What's on your mind?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/ai/assistant/query", {
        prompt: input,
        contextType: "OVERLAY"
      });
      
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting to my neural core right now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 h-16 w-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 group"
      >
         <Sparkles className="h-7 w-7 group-hover:rotate-12 transition-transform" />
         <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <div className={clsx(
      "fixed bottom-8 right-8 w-[400px] max-w-[90vw] bg-white rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.2)] flex flex-col z-50 overflow-hidden border border-gray-100 transition-all duration-500",
      isMinimized ? "h-20" : "h-[600px] max-h-[80vh]"
    )}>
      {/* Header */}
      <div className="bg-gray-950 p-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
               <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">SabaHub Neural AI</div>
               <div className="text-sm font-black text-white">Advanced Assistant</div>
            </div>
         </div>
         
         <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-gray-500 hover:text-white transition-colors">
               <Minus className="h-4 w-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors">
               <X className="h-4 w-4" />
            </button>
         </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
             {messages.map((m, i) => (
               <div key={i} className={clsx(
                 "flex flex-col max-w-[85%]",
                 m.role === "user" ? "ml-auto items-end" : "items-start"
               )}>
                  <div className={clsx(
                    "p-4 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm",
                    m.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-gray-50 text-gray-900 rounded-tl-none border border-gray-100"
                  )}>
                    {m.content}
                  </div>
                  <span className="text-[9px] font-black text-gray-300 uppercase mt-2 px-1">
                    {m.role === "assistant" ? "AI Core" : "You"}
                  </span>
               </div>
             ))}
             {loading && (
               <div className="flex items-start gap-2">
                  <div className="p-4 bg-gray-50 rounded-[24px] rounded-tl-none border border-gray-100">
                     <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                     </div>
                  </div>
               </div>
             )}
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-2 overflow-x-auto no-scrollbar">
             <div className="flex gap-2">
                {["Write Post", "Review Profile", "Find Jobs", "Translate"].map(a => (
                  <button 
                    key={a}
                    onClick={() => setInput(prev => (prev ? prev + " " + a : a))}
                    className="whitespace-nowrap px-3 py-1.5 bg-gray-50 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-100 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                  >
                    {a}
                  </button>
                ))}
             </div>
          </div>

          {/* Input Area */}
          <div className="p-6">
             <div className="relative flex items-center bg-gray-50 rounded-[24px] border border-gray-100 focus-within:border-indigo-200 focus-within:shadow-xl focus-within:shadow-indigo-500/5 transition-all">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask me anything..."
                  className="w-full bg-transparent py-4 pl-5 pr-14 text-sm font-medium text-gray-950 outline-none"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 h-10 w-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:bg-gray-200 transition-all"
                >
                   <Send className="h-4 w-4" />
                </button>
             </div>
             
             <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                   <Zap className="h-3 w-3 text-amber-500" />
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Low Latency</span>
                </div>
                <div className="h-1 w-1 bg-gray-200 rounded-full" />
                <div className="flex items-center gap-1">
                   <MessageSquare className="h-3 w-3 text-blue-500" />
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">End-to-End Encrypted</span>
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
