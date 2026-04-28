import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, Minimize2 } from 'lucide-react';
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
      {/* Chat Button */}
      {!isOpen && (
        <>
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#7A9D7A] hover:bg-[#6A8D6A] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <a
            href={api.agents.getWhatsAppConnectURL('cliffie')}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-24 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BD5C] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
            title="Chat on WhatsApp"
          >
            <MessageCircle className="w-6 h-6" />
          </a>
        </>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[380px] h-[500px] max-h-[80vh] flex flex-col shadow-2xl border-0 overflow-hidden">
          {/* Header */}
          <div className="bg-[#7A9D7A] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🐔</span>
              </div>
              <div>
                <h3 className="font-semibold">Cliffie</h3>
                <p className="text-xs text-white/80">Support Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-[#7A9D7A] text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[#7A9D7A]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading || !conversation}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || !conversation}
                className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}