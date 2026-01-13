'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, HelpCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
  profiles: any;
}

interface LiveChatProps {
  liveStreamId: string;
}

const QUICK_QUESTIONS = [
  "Zoom sur la matière ?",
  "Tu portes quelle taille ?",
  "C'est dispo en quelle couleur ?",
  "Le prix ?",
  "Livraison rapide ?",
];

export function LiveChat({ liveStreamId }: LiveChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`chat_${liveStreamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_stream_id=eq.${liveStreamId}`,
        },
        (payload) => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveStreamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    const { data, error } = await supabase
      .from('live_chat_messages')
      .select(`
        id,
        user_id,
        message,
        is_pinned,
        created_at,
        profiles (
          first_name,
          last_name,
          is_admin
        )
      `)
      .eq('live_stream_id', liveStreamId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  }

  async function sendMessage(message: string) {
    if (!user) {
      toast.error('Connectez-vous pour participer au chat');
      return;
    }

    if (!message.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from('live_chat_messages')
      .insert({
        live_stream_id: liveStreamId,
        user_id: user.id,
        message: message.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }

    setNewMessage('');
    setLoading(false);
  }

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  function getUserDisplayName(msg: ChatMessage) {
    const firstName = msg.profiles?.first_name || '';
    const lastName = msg.profiles?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Anonyme';
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${
                  msg.is_pinned ? 'bg-yellow-50 border border-yellow-300 rounded-lg p-2' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${
                    msg.profiles?.is_admin ? 'text-[#D4AF37]' : 'text-gray-900'
                  }`}>
                    {getUserDisplayName(msg)}
                    {msg.profiles?.is_admin && (
                      <span className="ml-1 text-xs bg-gradient-to-r from-[#D4AF37] to-[#b8933d] text-white px-2 py-0.5 rounded-full">
                        Morgane
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{msg.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t p-4 space-y-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#b8933d] text-white border-none hover:from-[#b8933d] hover:to-[#D4AF37]"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Morgane, j'hésite !
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            {QUICK_QUESTIONS.map((question, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => sendMessage(question)}
              >
                {question}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(newMessage);
              }
            }}
            placeholder="Votre message..."
            disabled={loading || !user}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(newMessage)}
            disabled={loading || !user || !newMessage.trim()}
            size="icon"
            className="bg-[#D4AF37] hover:bg-[#b8933d]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {!user && (
          <p className="text-xs text-center text-gray-500">
            Connectez-vous pour participer au chat
          </p>
        )}
      </div>
    </div>
  );
}
