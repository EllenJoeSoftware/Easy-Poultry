import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Loader2 } from 'lucide-react';
import moment from 'moment';
import ChatWindow from '../components/chat/ChatWindow';

export default function Messages() {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const chatIdFromUrl = urlParams.get('chatId');
  const startChatWith = urlParams.get('startChat');
  const listingTitle = urlParams.get('listingTitle');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {
        api.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['chats', user?.email],
    queryFn: async () => {
      const allChats = await api.entities.Chat.filter({}, '-last_message_date');
      return allChats.filter(c => c.participants?.includes(user.email));
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  // Auto-select chat from URL
  useEffect(() => {
    if (chatIdFromUrl && chats.length > 0 && !selectedChat) {
      const chat = chats.find(c => c.id === chatIdFromUrl);
      if (chat) setSelectedChat(chat);
    }
  }, [chatIdFromUrl, chats, selectedChat]);

  // Handle startChat parameter - create or find existing chat
  useEffect(() => {
    const startNewChat = async () => {
      if (!startChatWith || !user || creatingChat || selectedChat) return;
      
      // Don't message yourself
      if (startChatWith === user.email) return;
      
      setCreatingChat(true);
      
      try {
        // Check if chat already exists
        const existingChat = chats.find(c => 
          c.participants?.includes(startChatWith) && c.participants?.includes(user.email)
        );
        
        if (existingChat) {
          setSelectedChat(existingChat);
        } else {
          // Create new chat
          const newChat = await api.entities.Chat.create({
            participants: [user.email, startChatWith],
            last_message: listingTitle ? `Inquiry about: ${listingTitle}` : null,
            last_message_date: new Date().toISOString(),
            last_message_by: user.email,
            unread_count: { [startChatWith]: 1 }
          });
          
          // Send initial message if listing title provided
          if (listingTitle) {
            await api.entities.ChatMessage.create({
              chat_id: newChat.id,
              sender_email: user.email,
              sender_name: user.full_name,
              message: `Hi! I'd like to discuss: ${listingTitle}`
            });
          }
          
          queryClient.invalidateQueries(['chats']);
          setSelectedChat(newChat);
        }
        
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (error) {
        console.error('Error creating chat:', error);
      } finally {
        setCreatingChat(false);
      }
    };
    
    if (user && chats !== undefined && !isLoading) {
      startNewChat();
    }
  }, [startChatWith, user, chats, isLoading, creatingChat, selectedChat, listingTitle, queryClient]);

  if (!user || creatingChat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  const totalUnread = chats.reduce((sum, c) => sum + (c.unread_count?.[user.email] || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            {totalUnread > 0 && (
              <Badge className="bg-[#E07A5F]">{totalUnread} unread</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Conversations</h2>
              </div>
              
              {isLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : chats.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400">Start a conversation from a listing</p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {chats.map((chat) => {
                    const otherParticipant = chat.participants?.find(p => p !== user.email) || 'User';
                    const unread = chat.unread_count?.[user.email] || 0;
                    const isSelected = selectedChat?.id === chat.id;

                    return (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-[#7A9D7A]/10 border-l-4 border-[#7A9D7A]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium truncate ${unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                {otherParticipant.split('@')[0]}
                              </p>
                              {unread > 0 && (
                                <Badge className="bg-[#E07A5F] text-white text-xs px-1.5 py-0">
                                  {unread}
                                </Badge>
                              )}
                            </div>
                            {chat.last_message && (
                              <p className={`text-sm truncate mt-1 ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                                {chat.last_message_by === user.email ? 'You: ' : ''}{chat.last_message}
                              </p>
                            )}
                          </div>
                          {chat.last_message_date && (
                            <p className="text-xs text-gray-400 flex-shrink-0">
                              {moment(chat.last_message_date).fromNow()}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            {selectedChat ? (
              <ChatWindow
                chat={selectedChat}
                currentUser={user}
                onClose={() => setSelectedChat(null)}
              />
            ) : (
              <Card className="border-0 shadow-lg h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a conversation to start messaging</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}