'use client';

import { useEffect, useRef, useState } from 'react';
import { BiSend, BiX } from 'react-icons/bi';

interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface ChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

export default function Chat({
  messages,
  currentUserId,
  onSendMessage,
  onClose,
}: ChatProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/45 backdrop-blur-md border-l border-zinc-800/80 w-80 shadow-2xl flex-shrink-0 animate-slide-in">
      {/* Chat Title / Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800/60 bg-zinc-950/80">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
          <h2 className="text-zinc-100 font-semibold text-sm tracking-wide">In-Call Chat</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
        >
          <BiX className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <span className="text-indigo-400/80 text-3xl mb-2 animate-bounce">💬</span>
            <p className="text-zinc-400 font-medium text-xs">No messages yet</p>
            <p className="text-zinc-600 text-[10px] mt-1 leading-relaxed">
              Send a message to everyone in this room call.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                } space-y-1`}
              >
                {/* Sender Name */}
                {!isMe && (
                  <span className="text-[10px] text-zinc-500 font-semibold pl-1">
                    {msg.senderName}
                  </span>
                )}
                {/* Chat Bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words font-medium shadow-md ${
                    isMe
                      ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-tr-none'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  {msg.message}
                </div>
                {/* Timestamp */}
                <span className="text-[9px] text-zinc-600 px-1 font-medium">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input Box */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-zinc-800/60 bg-zinc-950/80 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center"
        >
          <BiSend className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
