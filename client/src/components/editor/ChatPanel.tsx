import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';

interface ChatMessage {
  id: number;
  roomId: number;
  userId: number;
  message: string;
  createdAt: string;
  user: {
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface ChatPanelProps {
  socket: Socket | null;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ socket, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!socket) return;

    // Request full chat history from database
    socket.emit('chat:get_history');

    // Listen for past history
    const onChatHistory = (history: ChatMessage[]) => {
      setMessages(history);
    };

    // Listen for new messages
    const onChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat:history', onChatHistory);
    socket.on('chat:message', onChatMessage);

    return () => {
      socket.off('chat:history', onChatHistory);
      socket.off('chat:message', onChatMessage);
    };
  }, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = inputVal.trim();
    if (!text || !socket) return;
    if (text.length > 2000) {
      alert('Message length cannot exceed 2000 characters.');
      return;
    }

    socket.emit('chat:send', { message: text });
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-[320px] shrink-0 border-l border-outline-variant/20 flex flex-col bg-surface-container-lowest select-none">
      {/* Header */}
      <div className="h-[48px] px-md flex items-center justify-between border-b border-outline-variant/20 shrink-0">
        <div className="flex items-center gap-xs font-bold text-on-surface">
          <span className="material-symbols-outlined text-[20px] text-primary">chat_bubble</span>
          <span className="font-label-md text-label-md">Room Chat</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-md flex flex-col gap-md">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/40 gap-xs">
            <span className="material-symbols-outlined text-[36px]">forum</span>
            <span className="font-label-md text-[12px]">No messages yet</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUser?.id !== undefined && String(msg.userId) === String(currentUser.id);
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                {/* Username / Name */}
                {!isMe && (
                  <span className="font-label-md text-[11px] text-on-surface-variant font-semibold mb-[2px] px-xs">
                    {msg.user.firstName}
                  </span>
                )}
                {/* Bubble */}
                <div
                  className={`px-md py-sm rounded-2xl text-body-md ${
                    isMe
                      ? 'bg-primary text-on-primary rounded-tr-none'
                      : 'bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-[13px]">{msg.message}</p>
                </div>
                {/* Time */}
                <span className="text-[10px] text-on-surface-variant/60 mt-[2px] px-xs">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-md border-t border-outline-variant/20 bg-surface-container-lowest shrink-0">
        <div className="flex gap-sm items-center">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={2000}
            className="flex-1 px-md py-sm rounded-full border border-outline-variant/30 font-label-md text-label-md bg-surface-container-low text-on-surface focus:outline-none focus:border-primary transition-all text-xs"
          />
          <button
            onClick={handleSend}
            disabled={!inputVal.trim()}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-on-primary shadow-sm transition-all cursor-pointer ${
              inputVal.trim() ? 'bg-primary hover:bg-primary/90' : 'bg-surface-container-highest text-on-surface-variant/40'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
