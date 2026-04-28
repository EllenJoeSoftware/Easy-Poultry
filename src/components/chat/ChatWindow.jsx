import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Send, Loader2 } from 'lucide-react';
import moment from 'moment';
import { createPageUrl } from '../../utils';

export default function ChatWindow({ chat, currentUser, onClose }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const otherParticipant = chat.participants?.find(p => p !== currentUser.email) || 'User';

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', chat.id],
    queryFn: () => api.entities.ChatMessage.filter({ chat_id: chat.id }, 'created_date'),
    enabled: !!chat.id,
    refetchInterval: 3000
  });

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      const unreadMessages = messages.filter(m => !m.read && m.sender_email !== currentUser.email);
      for (const msg of unreadMessages) {
        await api.entities.ChatMessage.update(msg.id, { read: true });
      }
      if (unreadMessages.length > 0) {
        // Update unread count in chat
        const newUnreadCount = { ...(chat.unread_count || {}) };
        newUnreadCount[currentUser.email] = 0;
        await api.entities.Chat.update(chat.id, { unread_count: newUnreadCount });
        queryClient.invalidateQueries(['chats']);
      }
    };
    if (messages.length > 0) markAsRead();
  }, [messages, currentUser.email, chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      // Create message
      await api.entities.ChatMessage.create({
        chat_id: chat.id,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        message: messageText
      });
      
      // Update chat with last message
      const newUnreadCount = { ...(chat.unread_count || {}) };
      chat.participants.forEach(p => {
        if (p !== currentUser.email) {
          newUnreadCount[p] = (newUnreadCount[p] || 0) + 1;
        }
      });
      
      await api.entities.Chat.update(chat.id, {
        last_message: messageText.slice(0, 100),
        last_message_date: new Date().toISOString(),
        last_message_by: currentUser.email,
        unread_count: newUnreadCount
      });

      // Create notification for other participant
      await api.entities.Notification.create({
        user_email: otherParticipant,
        type: 'message',
        title: 'New Message',
        message: `${currentUser.full_name}: ${messageText.slice(0, 50)}...`,
        link: createPageUrl('Messages'),
        related_id: chat.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-messages', chat.id]);
      queryClient.invalidateQueries(['chats']);
      setMessage('');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  return (
    <Card className="flex flex-col h-[500px] border-0 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-[#7A9D7A] text-white rounded-t-lg">
        <div>
          <p className="font-semibold">{otherParticipant.split('@')[0]}</p>
          <p className="text-xs text-white/80">{otherParticipant}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_email === currentUser.email;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isOwn 
                    ? 'bg-[#7A9D7A] text-white rounded-br-md' 
                    : 'bg-white border rounded-bl-md'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                    {moment(msg.created_date).format('h:mm A')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}