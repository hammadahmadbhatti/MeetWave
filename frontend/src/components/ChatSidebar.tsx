'use client';
import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Message } from '@/types';

interface ChatSidebarProps {
  messages: Message[];
  isOpen: boolean;
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onClose: () => void;
}

export default function ChatSidebar({ messages, isOpen, currentUserId, onSendMessage, onClose }: ChatSidebarProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
  };

  return (
    <div className={clsx(
      'fixed right-0 top-0 bottom-0 w-80 glass-dark z-40 flex flex-col transition-transform duration-300',
      isOpen ? 'translate-x-0' : 'translate-x-full'
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-200">Chat</h3>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={clsx(
            'animate-fade-in',
            msg.type === 'SYSTEM' || msg.senderId === 'system'
              ? 'text-center'
              : msg.senderId === currentUserId ? 'flex justify-end' : 'flex justify-start'
          )}>
            {msg.type === 'SYSTEM' || msg.senderId === 'system' ? (
              <span className="text-xs text-surface-500 italic">{msg.content}</span>
            ) : (
              <div className={clsx(
                'max-w-[80%] px-3 py-2 rounded-2xl text-sm',
                msg.senderId === currentUserId
                  ? 'bg-brand-500/20 text-brand-200 rounded-br-md'
                  : 'bg-white/10 text-surface-200 rounded-bl-md'
              )}>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-white/5 rounded-xl text-sm text-white placeholder-surface-500 outline-none border border-white/10 focus:border-brand-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
