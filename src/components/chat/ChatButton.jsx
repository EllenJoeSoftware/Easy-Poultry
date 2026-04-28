import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function ChatButton({ sellerEmail, listingId, variant = 'default', className = '' }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const startChatMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        api.auth.redirectToLogin(window.location.href);
        return null;
      }

      if (user.email === sellerEmail) {
        toast.error("You can't message yourself");
        return null;
      }

      // Check if chat already exists
      const existingChats = await api.entities.Chat.filter({});
      const existingChat = existingChats.find(c => 
        c.participants?.includes(user.email) && 
        c.participants?.includes(sellerEmail) &&
        (!listingId || c.listing_id === listingId)
      );

      if (existingChat) {
        return existingChat;
      }

      // Create new chat
      const newChat = await api.entities.Chat.create({
        participants: [user.email, sellerEmail],
        listing_id: listingId,
        unread_count: { [sellerEmail]: 0, [user.email]: 0 }
      });

      return newChat;
    },
    onSuccess: (chat) => {
      if (chat) {
        queryClient.invalidateQueries(['chats']);
        navigate(createPageUrl('Messages') + `?chatId=${chat.id}`);
      }
    }
  });

  const handleClick = () => {
    if (!user) {
      toast.error('Please login to send messages');
      api.auth.redirectToLogin(window.location.href);
      return;
    }
    startChatMutation.mutate();
  };

  // Don't show button if viewing own profile
  if (user?.email === sellerEmail) return null;

  return (
    <Button
      onClick={handleClick}
      disabled={startChatMutation.isPending}
      variant={variant}
      className={className}
    >
      {startChatMutation.isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4 mr-2" />
      )}
      Message
    </Button>
  );
}