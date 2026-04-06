"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot, User, Settings } from "lucide-react";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  formattedTime?: string; // store formatted time after client mount
};

// Demo AI responses (unchanged)
const getBotResponse = async (userMessage: string): Promise<string> => {
  const msg = userMessage.toLowerCase().trim();
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 300));

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey"))
    return "Good evening. How may I assist you today?";
  if (msg.includes("how are you") || msg.includes("how's it going"))
    return "I'm functioning optimally, thank you. And yourself?";
  if (msg.includes("what can you do") || msg.includes("capabilities") || msg.includes("help"))
    return "I offer conversation, inspiration, and a touch of wit. Ask for a joke, a quote, or simply share your thoughts.";
  if (msg.includes("joke") || msg.includes("funny")) {
    const jokes = [
      "Why do programmers prefer dark mode? Because light attracts bugs. 🐛",
      "What did the ocean say to the beach? Nothing, it just waved.",
      "Why don't scientists trust atoms? Because they make up everything.",
      "I told my computer I needed a break, now it won’t stop sending me vacation ads.",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  if (msg.includes("inspire") || msg.includes("motivation"))
    return "“The only way to do great work is to love what you do.” – Steve Jobs";
  if (msg.includes("bye") || msg.includes("goodbye"))
    return "Until next time. Wishing you a pleasant day.";

  return `I appreciate your message. Would you like to explore further?`;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-static", // static id
      text: "Welcome. I'm your personal assistant. How may I elevate your day?",
      sender: "bot",
      timestamp: new Date(), // will be overridden on client
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // After hydration, update formatted timestamps for all messages
  useEffect(() => {
    setMounted(true);
    // Update timestamps for all messages (only once)
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        formattedTime: formatTime(msg.timestamp),
      }))
    );
  }, []);

  // Helper to format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const now = new Date();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: "user",
      timestamp: now,
      formattedTime: formatTime(now),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);
    setIsSuggestionOpen(false);

    const botReply = await getBotResponse(text);
    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      text: botReply,
      sender: "bot",
      timestamp: now,
      formattedTime: formatTime(now),
    };
    setMessages((prev) => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestions = [
    "Tell me a joke",
    "Inspire me",
    "What can you do?",
    "How are you?",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
    setIsSuggestionOpen(false);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600&display=swap');
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', sans-serif;
          background: #0a0a0a;
          color: #e8e6e3;
        }
        .luxury-gradient {
          background: radial-gradient(circle at 30% 20%, rgba(198, 164, 63, 0.08) 0%, rgba(10, 10, 10, 0.95) 70%);
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #c6a43f;
          animation: pulseDot 1.2s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulseDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .message-bubble-user {
          background: linear-gradient(135deg, #c6a43f, #b38f2e);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .message-bubble-bot {
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(198, 164, 63, 0.4);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .custom-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #c6a43f;
          border-radius: 10px;
        }
        input::placeholder {
          color: rgba(232, 230, 227, 0.4);
          font-weight: 300;
        }
      `}</style>

      <div className="fixed inset-0 bg-[#0a0a0a] luxury-gradient z-[-2]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(198,164,63,0.05)_0%,_transparent_70%)] z-[-1]" />

      <div className="relative z-10 flex flex-col h-screen max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6 backdrop-blur-md bg-black/30 rounded-2xl border border-[#c6a43f]/30 px-5 py-3 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[#c6a43f] rounded-full blur-md opacity-50 animate-pulse"></div>
              <Sparkles className="w-7 h-7 text-[#c6a43f] relative z-10" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight bg-gradient-to-r from-[#e6d5b8] to-[#c6a43f] bg-clip-text text-transparent">
                Luxe Chat
              </h1>
              <p className="text-xs text-[#c6a43f]/60 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-[#c6a43f] animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 45 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all"
          >
            <Settings className="w-5 h-5 text-[#c6a43f]" />
          </motion.button>
        </motion.div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto mb-4 pr-1 custom-scroll">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.sender === "user" ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 400 }}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-4`}
              >
                <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-[#c6a43f] to-[#9b7a2e]"
                        : "bg-black/50 border border-[#c6a43f]/40"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-[#c6a43f]" />
                    )}
                  </motion.div>

                  <div className="flex flex-col">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.sender === "user"
                          ? "message-bubble-user text-white rounded-br-none"
                          : "message-bubble-bot text-gray-200 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className={`text-[10px] mt-1 text-gray-500 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                      {mounted ? msg.formattedTime : "..."}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-start mb-4"
            >
              <div className="flex gap-2 items-center bg-black/30 backdrop-blur-sm border border-[#c6a43f]/30 rounded-2xl rounded-bl-none px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
                <span className="text-xs text-[#c6a43f]/70">Composing</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {isSuggestionOpen && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 mb-4 justify-center"
          >
            {suggestions.map((suggestion) => (
              <motion.button
                key={suggestion}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 rounded-full text-sm font-light bg-black/30 backdrop-blur-sm border border-[#c6a43f]/30 text-[#e6d5b8] hover:bg-black/50 transition-all"
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Input */}
        <div className="relative flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-2xl border border-[#c6a43f]/30 p-2 shadow-2xl transition-all duration-300 focus-within:border-[#c6a43f] focus-within:shadow-[0_0_12px_rgba(198,164,63,0.3)]">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-white placeholder:text-gray-500 px-4 py-3 outline-none"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
            className={`p-3 rounded-xl ${
              inputValue.trim()
                ? "bg-gradient-to-r from-[#c6a43f] to-[#9b7a2e] text-white shadow-lg"
                : "bg-white/5 text-gray-500 cursor-not-allowed"
            } transition-all`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </>
  );
}