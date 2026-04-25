'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, X, Send, User, ShieldCheck } from 'lucide-react';
import { useAccount } from '@/context/AccountContext';

export default function SupportChat() {
  const { user } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user?.phone) {
      fetchMessages();
      const channel = supabase
        .channel('support_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
          if (payload.new.customer_phone === user.phone) {
            setMessages((prev) => [...prev, payload.new]);
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [isOpen, user?.phone]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('customer_phone', user?.phone)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSend = async () => {
    if (!message.trim() || !user?.phone) return;
    setLoading(true);
    const { error } = await supabase.from('support_messages').insert({
      customer_phone: user.phone,
      sender: 'customer',
      message: message.trim()
    });
    if (!error) setMessage('');
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[100] md:bottom-10 md:right-10">
      {/* CHAT BUBBLE */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl active-scale animate-bounce-slow"
        >
          <MessageCircle size={32} />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 border-2 border-white rounded-full" />
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="w-[340px] h-[500px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
          {/* HEADER */}
          <div className="bg-black text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-green-400" size={24} />
              <div>
                <h3 className="text-[14px] font-black uppercase tracking-widest">DISCO Support</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase">Warehouse Dispatcher Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1">
              <X size={20} />
            </button>
          </div>

          {/* MESSAGES */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-uber-gray/30 no-scrollbar"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center text-black/10">
                  <MessageCircle size={32} />
                </div>
                <p className="text-[11px] font-black uppercase text-black/30 tracking-widest leading-relaxed">
                  How can we help you today? Ask about your order or product availability.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div 
                key={i}
                className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 text-[13px] font-bold ${
                  msg.sender === 'customer' 
                    ? 'bg-black text-white' 
                    : 'bg-white border border-black/10 text-black shadow-sm'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div className="p-4 bg-white border-t border-black/10 flex gap-2">
            <input 
              type="text"
              placeholder="Type your message..."
              className="flex-1 h-12 bg-uber-gray px-4 text-sm font-bold outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="w-12 h-12 bg-black text-white flex items-center justify-center active-scale disabled:opacity-20"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
