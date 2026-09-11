'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Bot, X, Send, Loader2, Sparkles, User } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Hello! I\'m UIU RideWave AI Assistant. Ask me anything about bus routes, stoppages, timings, or seat availability! 🚌',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages,
        }),
      });

      const data = await res.json();
      if (res.ok && data.response) {
        setMessages((prev) => [...prev, { role: 'model', content: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'model', content: 'Sorry, I encountered an issue. Please try again!' },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: 'Network error. Please check your connection.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Chat assistant"
          className="fixed bottom-6 right-6 z-[2000] h-16 rounded-full bg-gradient-to-br from-[#F37021] to-[#E85D0A] px-7 text-white shadow-xl transition-transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <Bot size={30} />
          <span className="text-base font-bold">AI Chat</span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 z-[2000] w-[min(28rem,calc(100vw-2rem))] h-[min(38rem,calc(100vh-2rem))] shadow-2xl flex flex-col border-0 overflow-hidden">
          <CardHeader className="bg-[#1E3A5F] text-white p-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="bg-[#F37021] p-1.5 rounded-lg">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-1">
                  RideWave AI <Sparkles size={12} className="text-amber-400" />
                </CardTitle>
                <p className="text-[11px] text-slate-300">Powered by Gemini AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              <X size={18} />
            </Button>
          </CardHeader>

          <CardContent ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 text-sm ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="h-7 w-7 rounded-full bg-[#F37021] flex items-center justify-center text-white shrink-0 text-xs">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#F37021] text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin text-[#F37021]" /> AI is thinking...
              </div>
            )}
          </CardContent>

          <CardFooter className="p-3 bg-white border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex w-full items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about routes, seats, timings..."
                className="h-10 text-sm border-slate-200 focus-visible:ring-[#F37021]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 bg-[#F37021] hover:bg-[#E85D0A] shrink-0"
              >
                <Send size={16} />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
