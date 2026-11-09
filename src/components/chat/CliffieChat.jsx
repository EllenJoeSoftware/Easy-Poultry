import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/client';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CliffieChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !conversation) {
      initConversation();
    }
  }, [isOpen]);

  const initConversation = async () => {
    try {
      const newConversation = await api.agents.createConversation({
        agent_name: 'cliffie',
        metadata: { name: 'Support Chat' }
      });
      setConversation(newConversation);
      setMessages([{
        role: 'assistant',
        content: "Hey! 👋 I'm Cliffie, your Easy Poultry assistant! I can help you with browsing listings, buying or selling poultry, managing your account, and more. What can I help you with today?"
      }]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = api.agents.subscribeToConversation(conversation.id, (data) => {
      if (data.messages) {
        setMessages(data.messages);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [conversation?.id]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      await api.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating launchers */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          <a
            href={api.agents.getWhatsAppConnectURL('cliffie')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white border border-border text-moss-700 shadow-soft hover:bg-cream-deep flex items-center justify-center transition-all hover:scale-105"
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="h-14 pl-4 pr-5 rounded-full bg-moss-700 hover:bg-moss-800 text-cream shadow-lg flex items-center gap-2.5 transition-all hover:scale-105"
            aria-label="Open Cliffie support chat"
          >
            <span className="w-8 h-8 rounded-full bg-cream/15 flex items-center justify-center text-lg leading-none">🐔</span>
            <span className="text-sm font-medium hidden sm:inline">Ask Cliffie</span>
            <Sparkles className="w-4 h-4 text-yolk-300 sm:hidden" />
          </button>
        </div>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto z-50 sm:w-[380px] h-[540px] max-h-[80vh] card-premium flex flex-col overflow-hidden">
          {/* Header */}
          <div className="relative bg-moss-gradient text-cream p-4 flex items-center justify-between overflow-hidden">
            <div className="absolute inset-0 grain opacity-50" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 bg-cream/15 rounded-full flex items-center justify-center">
                <span className="text-xl leading-none">🐔</span>
              </div>
              <div>
                <h3 className="font-display text-base leading-tight">Cliffie</h3>
                <p className="text-[11px] text-cream/70 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-fresh-300" />
                  Support assistant
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="relative w-8 h-8 hover:bg-cream/15 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] px-4 py-2.5 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-moss-700 text-cream rounded-2xl rounded-br-md'
                      : 'bg-white border border-border text-ink rounded-2xl rounded-bl-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="text-sm leading-relaxed prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-moss-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-border">
            <div className="flex gap-2 items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message…"
                className="flex-1 h-11 bg-cream border border-border rounded-full px-4 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-moss-300 disabled:opacity-60"
                disabled={isLoading || !conversation}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || !conversation}
                className="w-11 h-11 rounded-full bg-moss-700 hover:bg-moss-800 text-cream flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
