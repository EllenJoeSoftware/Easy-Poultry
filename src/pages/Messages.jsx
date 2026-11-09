import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Loader2, Search, X, ChevronLeft } from 'lucide-react';
import moment from 'moment';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import ChatWindow from '../components/chat/ChatWindow';

const initials = (email = '') => email.split('@')[0].slice(0, 2).toUpperCase();
const hue = (s = '') => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
const AVATAR = ['bg-moss-100 text-moss-800', 'bg-fresh-50 text-moss-700', 'bg-yolk-50 text-yolk-700', 'bg-terracotta-50 text-terracotta-600', 'bg-cream-deep text-ink/70'];

export default function Messages() {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const chatIdFromUrl = urlParams.get('chatId');
  const startChatWith = urlParams.get('startChat');
  const listingTitle = urlParams.get('listingTitle');

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => api.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['chats', user?.email],
    queryFn: async () => {
      const allChats = await api.entities.Chat.filter({}, '-last_message_date');
      return allChats.filter(c => c.participants?.includes(user.email));
    },
    enabled: !!user,
    refetchInterval: 5000,
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
      if (startChatWith === user.email) return;
      setCreatingChat(true);
      try {
        const existingChat = chats.find(c => c.participants?.includes(startChatWith) && c.participants?.includes(user.email));
        if (existingChat) {
          setSelectedChat(existingChat);
        } else {
          const newChat = await api.entities.Chat.create({
            participants: [user.email, startChatWith],
            last_message: listingTitle ? `Inquiry about: ${listingTitle}` : null,
            last_message_date: new Date().toISOString(),
            last_message_by: user.email,
            unread_count: { [startChatWith]: 1 },
          });
          if (listingTitle) {
            await api.entities.ChatMessage.create({
              chat_id: newChat.id,
              sender_email: user.email,
              sender_name: user.full_name,
              message: `Hi! I'd like to discuss: ${listingTitle}`,
            });
          }
          queryClient.invalidateQueries({ queryKey: ['chats'] });
          setSelectedChat(newChat);
        }
        window.history.replaceState({}, '', window.location.pathname);
      } catch (error) {
        console.error('Error creating chat:', error);
      } finally {
        setCreatingChat(false);
      }
    };
    if (user && chats !== undefined && !isLoading) startNewChat();
  }, [startChatWith, user, chats, isLoading, creatingChat, selectedChat, listingTitle, queryClient]);

  if (!user || creatingChat) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const totalUnread = chats.reduce((sum, c) => sum + (c.unread_count?.[user.email] || 0), 0);
  const visible = chats.filter(c => {
    if (!search) return true;
    const other = c.participants?.find(p => p !== user.email) || '';
    return other.toLowerCase().includes(search.toLowerCase()) || c.last_message?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <PageShell
      variant="compact"
      eyebrow="Inbox"
      title="Messages"
      subtitle={totalUnread > 0 ? `${totalUnread} unread message${totalUnread === 1 ? '' : 's'} waiting for you.` : 'Chat with buyers and sellers about listings, auctions and orders.'}
    >
      <div className="card-premium overflow-hidden grid lg:grid-cols-[340px_1fr] min-h-[600px]">
        {/* Conversation list */}
        <aside className={`border-r border-border flex flex-col ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…"
                className="w-full bg-cream border border-border rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-cream-deep flex items-center justify-center"><X className="w-3.5 h-3.5 text-ink/50" /></button>}
            </div>
          </div>

          {isLoading ? (
            <div className="divide-y divide-border">{[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 p-4 animate-pulse"><div className="w-11 h-11 rounded-full bg-cream-deep" /><div className="flex-1 space-y-2"><div className="h-4 bg-cream-deep rounded w-1/2" /><div className="h-3 bg-cream-deep rounded w-3/4" /></div></div>
            ))}</div>
          ) : visible.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-moss-50 border border-moss-100 flex items-center justify-center text-moss-700 mb-4"><MessageCircle className="w-6 h-6" /></div>
              <p className="font-display text-ink">{search ? 'No matches' : 'No messages yet'}</p>
              <p className="text-sm text-ink/55 mt-1">{search ? 'Try another name or keyword.' : 'Start a conversation from any listing.'}</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-border max-h-[70vh]">
              {visible.map(chat => {
                const other = chat.participants?.find(p => p !== user.email) || 'User';
                const unread = chat.unread_count?.[user.email] || 0;
                const active = selectedChat?.id === chat.id;
                return (
                  <li key={chat.id}>
                    <button onClick={() => setSelectedChat(chat)}
                      className={`relative w-full flex gap-3 p-4 text-left transition-colors ${active ? 'bg-moss-50/70' : 'hover:bg-cream/70'}`}>
                      {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-moss-600" />}
                      <div className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold ${AVATAR[hue(other)]}`}>{initials(other)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate ${unread ? 'font-semibold text-ink' : 'font-medium text-ink/80'}`}>{other.split('@')[0]}</p>
                          {chat.last_message_date && <span className="text-[11px] text-ink/45 whitespace-nowrap">{moment(chat.last_message_date).fromNow(true)}</span>}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={`text-sm truncate ${unread ? 'text-ink/80' : 'text-ink/50'}`}>{chat.last_message_by === user.email ? 'You: ' : ''}{chat.last_message || 'No messages yet'}</p>
                          {unread > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-terracotta-500 text-white text-[11px] font-semibold flex items-center justify-center">{unread}</span>}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Chat pane */}
        <section className={`flex flex-col bg-cream ${selectedChat ? 'flex' : 'hidden lg:flex'}`}>
          {selectedChat ? (
            <>
              <button onClick={() => setSelectedChat(null)} className="lg:hidden flex items-center gap-1 px-4 py-2 text-sm text-moss-700 bg-white border-b border-border"><ChevronLeft className="w-4 h-4" /> All conversations</button>
              <ChatWindow chat={selectedChat} currentUser={user} onClose={() => setSelectedChat(null)} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white border border-border shadow-soft flex items-center justify-center text-moss-700 mb-5"><MessageCircle className="w-9 h-9" strokeWidth={1.5} /></div>
              <h3 className="font-display text-xl text-ink">Select a conversation</h3>
              <p className="text-sm text-ink/55 mt-1 max-w-xs">Pick a chat on the left, or message a seller from any listing page.</p>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
