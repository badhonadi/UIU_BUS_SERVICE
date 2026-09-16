'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Bot, X, Send, Loader2, Sparkles, Compass, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}
const QUICK_PROMPTS = [
  '18 tarikh ki Mirpur er bus e seat ase?',
  'Agargaon theke kon route er bus e utha kache hobe?',
  'Bus fare koto & ticket booking niyam ki?',
  'Dhanmondi theke UIU kon bus jabe?',
];

function FormattedContent({ text }: { text: string }) {
  // Simple, clean markdown-like parser for bold text, bullet points, headers, and line breaks
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-[13.5px] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1">
              {parseBold(trimmed.replace(/^###\s*/, ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-slate-900 text-base mt-2.5 mb-1 border-b pb-0.5">
              {parseBold(trimmed.replace(/^##\s*/, ''))}
            </h3>
          );
        }

        // Bullet points
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const bulletText = trimmed.replace(/^[\*\-•]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-[#F37021] font-bold text-xs mt-0.5">•</span>
              <div className="flex-1">{parseBold(bulletText)}</div>
            </div>
          );
        }

        // Regular line
        return <p key={idx}>{parseBold(trimmed)}</p>;
      })}
    </div>
  );
}

function parseBold(text: string) {
  // Splits by **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content:
        'Hello! I am UIU RideWave AI Assistant. Ask me anything about bus routes, live seat availability, stoppages, timings, or how to reach UIU from any location in Dhaka! 🚌',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from DB on component mount
  useEffect(() => {
    let sid = '';
    try {
      sid = localStorage.getItem('ridewave_chat_session') || '';
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('ridewave_chat_session', sid);
      }
    } catch {
      sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    setSessionId(sid);

    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(sid)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.warn('Could not load chat history:', err);
      }
    }

    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  const handleClearChat = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      });
      setMessages([
        {
          role: 'model',
          content:
            'Chat cleared! How can I help you with UIU transportation today? 🚌',
        },
      ]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const sendMessage = async (userMsgText: string) => {
    if (!userMsgText.trim() || isLoading) return;

    const userMsg = userMsgText.trim();
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
          sessionId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.response) {
        setMessages((prev) => [...prev, { role: 'model', content: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: data.error || 'Sorry, I encountered an issue. Please try again!',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: 'Network error. Please check your internet connection.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Chat assistant"
          className="fixed bottom-6 right-6 z-[2000] h-14 rounded-full bg-gradient-to-r from-[#F37021] to-[#E85D0A] px-6 text-white shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-2.5 border border-white/20"
        >
          <Bot size={24} className="animate-bounce" />
          <span className="text-sm font-bold tracking-wide">AI Assistant</span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 z-[2000] w-[min(30rem,calc(100vw-2rem))] h-[min(40rem,calc(100vh-2rem))] shadow-2xl flex flex-col border border-slate-200 overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="bg-[#1E3A5F] text-white p-3.5 flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#F37021] p-2 rounded-xl shadow-inner">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-white">
                  UIU RideWave AI <Sparkles size={13} className="text-amber-300" />
                </CardTitle>
                <p className="text-[11px] text-slate-300">Live Routes & Seat Assistance</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                disabled={isClearing}
                title="Clear chat history"
                className="text-white/60 hover:text-red-300 hover:bg-white/10 h-8 w-8 rounded-full"
              >
                {isClearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 rounded-full"
              >
                <X size={18} />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent ref={scrollRef} className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/80">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 text-sm ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="h-7 w-7 rounded-full bg-[#F37021] flex items-center justify-center text-white shrink-0 text-xs shadow-sm mt-0.5">
                    <Bot size={15} />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-[#F37021] text-white rounded-tr-none shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <FormattedContent text={msg.content} />
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 p-2.5 rounded-xl w-fit shadow-sm">
                <Loader2 size={15} className="animate-spin text-[#F37021]" /> RideWave AI is checking...
              </div>
            )}
          </CardContent>

          {/* Quick suggestions if 2 or fewer messages */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200/70 flex flex-wrap gap-1.5 shrink-0">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 w-full mb-0.5">
                <Compass size={12} className="text-[#F37021]" /> Suggested questions:
              </span>
              {QUICK_PROMPTS.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                  className="text-[11px] bg-white hover:bg-orange-50 text-slate-700 hover:text-[#F37021] px-2.5 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input */}
          <CardFooter className="p-3 bg-white border-t border-slate-200 shrink-0">
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
                placeholder="Ask about seats, routes, location..."
                className="h-10 text-sm border-slate-200 focus-visible:ring-[#F37021] rounded-xl"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 bg-[#F37021] hover:bg-[#E85D0A] shrink-0 rounded-xl transition-transform active:scale-95"
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

