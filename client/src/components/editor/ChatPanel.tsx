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
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

    // Listen for agent task errors
    const onAgentTaskError = (err: { reason: string; message: string }) => {
      setSuggestionError(err.message || 'Failed to assign task to @BeaverBot');
      setTimeout(() => setSuggestionError(null), 4000);
    };

    // Listen for agent task creation synthetic messages
    const onAgentTaskCreated = (data: { taskId: string; instruction: string }) => {
      const syntheticMsg: ChatMessage = {
        id: -Date.now(),
        roomId: 0,
        userId: 901,
        message: `🤖 BeaverBot accepted the task: "${data.instruction}"`,
        createdAt: new Date().toISOString(),
        user: {
          username: 'BeaverBot',
          firstName: 'BeaverBot',
          lastName: '🤖',
        },
      };
      setMessages((prev) => [...prev, syntheticMsg]);
    };

    // Listen for agent task completion/failure synthetic messages
    const onAgentTaskUpdate = (data: { taskId: string; stage: string; failureReason?: string; metadata?: any }) => {
      let text = '';
      if (data.stage === 'completed') {
        const fileRef = data.metadata?.targetFileName ? ` in ${data.metadata.targetFileName}` : '';
        text = `🤖 BeaverBot completed the task! Check the code${fileRef}.`;
      } else if (data.stage === 'failed') {
        text = `🤖 BeaverBot failed: ${data.failureReason || 'Internal error'}`;
      } else if (data.stage === 'cancelled') {
        text = `🤖 BeaverBot task was cancelled by user.`;
      }

      if (text) {
        const syntheticMsg: ChatMessage = {
          id: -Date.now() - Math.floor(Math.random() * 1000),
          roomId: 0,
          userId: 901,
          message: text,
          createdAt: new Date().toISOString(),
          user: {
            username: 'BeaverBot',
            firstName: 'BeaverBot',
            lastName: '🤖',
          },
        };
        setMessages((prev) => [...prev, syntheticMsg]);
      }
    };

    socket.on('chat:history', onChatHistory);
    socket.on('chat:message', onChatMessage);
    socket.on('agent:task_error', onAgentTaskError);
    socket.on('agent:task_created', onAgentTaskCreated);
    socket.on('agent:task_update', onAgentTaskUpdate);

    return () => {
      socket.off('chat:history', onChatHistory);
      socket.off('chat:message', onChatMessage);
      socket.off('agent:task_error', onAgentTaskError);
      socket.off('agent:task_created', onAgentTaskCreated);
      socket.off('agent:task_update', onAgentTaskUpdate);
    };
  }, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle @ mention auto-suggestion popup trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);

    // Show suggestion if user typed '@' or is typing '@beaverbot'
    const mentionMatch = val.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      if ('beaverbot'.startsWith(query)) {
        setShowMentionSuggestions(true);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const selectMention = (mentionName: string) => {
    setInputVal((prev) => {
      const updated = prev.replace(/@(\w*)$/, `@${mentionName} `);
      return updated;
    });
    setShowMentionSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    const text = inputVal.trim();
    if (!text || !socket) return;
    if (text.length > 2000) {
      alert('Message length cannot exceed 2000 characters.');
      return;
    }

    socket.emit('chat:send', { message: text });
    setInputVal('');
    setShowMentionSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionSuggestions && (e.key === 'Enter' || e.key === 'Tab')) {
      e.preventDefault();
      selectMention('BeaverBot');
      return;
    }

    if (e.key === 'Escape') {
      setShowMentionSuggestions(false);
      return;
    }

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

  const renderMessageContent = (text: string) => {
    const isBotMention = text.toLowerCase().startsWith('@beaverbot');
    if (isBotMention) {
      const mentionPart = text.slice(0, 10); // '@BeaverBot'
      const rest = text.slice(10);
      return (
        <span>
          <span className="inline-flex items-center gap-1 font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.5 rounded-md text-[11px] font-mono shadow-sm mr-1.5">
            🤖 {mentionPart}
          </span>
          <span className="text-neutral-100">{rest}</span>
        </span>
      );
    }
    return text;
  };

  return (
    <div className="w-[340px] shrink-0 border-l border-white/10 flex flex-col bg-neutral-950/85 backdrop-blur-xl shadow-2xl relative select-none overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[160px] h-[160px] bg-indigo-500/10 rounded-full blur-[70px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="h-[52px] px-4 flex items-center justify-between border-b border-white/10 bg-neutral-900/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 font-bold text-neutral-100">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold tracking-wide text-neutral-100">Room Chat</span>
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Collaboration
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Error Toast */}
      {suggestionError && (
        <div className="mx-3 mt-2 px-3 py-2 bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-1">
          <span className="material-symbols-outlined text-[16px] text-red-400">warning</span>
          <span>{suggestionError}</span>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 gap-2 my-auto py-12">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-center text-neutral-400 shadow-inner">
              <span className="material-symbols-outlined text-[24px]">forum</span>
            </div>
            <span className="text-[12px] font-medium text-neutral-300">No messages in room</span>
            <span className="text-[11px] text-neutral-500 text-center max-w-[200px] leading-relaxed">
              Type <code className="text-orange-400 bg-orange-500/10 px-1 py-0.5 rounded border border-orange-500/20 font-mono text-[10px]">@BeaverBot</code> to assign an automated coding task
            </span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUser?.id !== undefined && String(msg.userId) === String(currentUser.id);
            const isBot = msg.userId === 901 || msg.user?.username === 'BeaverBot';
            const isBotMention = msg.message.toLowerCase().startsWith('@beaverbot');

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[88%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                {/* Username / Name */}
                {!isMe && (
                  <span className="text-[11px] font-semibold mb-1 px-1 flex items-center gap-1 text-neutral-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${isBot ? 'bg-indigo-400' : 'bg-orange-400/80'}`}></span>
                    {isBot ? '🤖 BeaverBot' : (msg.user.firstName || msg.user.username)}
                  </span>
                )}
                {/* Bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-xs shadow-[0_4px_15px_rgba(246,99,23,0.25)] border border-orange-400/30'
                      : isBot
                      ? 'bg-gradient-to-r from-indigo-900/90 to-purple-900/90 text-indigo-100 rounded-2xl rounded-tl-xs border border-indigo-500/40 shadow-[0_4px_20px_rgba(99,102,241,0.3)] border-l-4 border-l-indigo-400 backdrop-blur-md'
                      : isBotMention
                      ? 'bg-gradient-to-r from-indigo-950/80 via-indigo-900/70 to-purple-950/80 text-neutral-100 rounded-2xl rounded-tl-xs border border-indigo-500/40 shadow-[0_4px_20px_rgba(99,102,241,0.25)] border-l-4 border-l-indigo-400 backdrop-blur-md'
                      : 'bg-neutral-900/80 text-neutral-100 rounded-2xl rounded-tl-xs border border-white/10 shadow-sm backdrop-blur-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {renderMessageContent(msg.message)}
                  </p>
                </div>
                {/* Time */}
                <span className={`text-[10px] mt-1 px-1 ${isMe ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention Auto-Suggestion Dropdown */}
      {showMentionSuggestions && (
        <div className="absolute bottom-[68px] left-3 right-3 bg-neutral-900/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Mention Participant</span>
            <span className="font-mono text-[9px] text-neutral-500">Tab / Enter</span>
          </div>
          <button
            onClick={() => selectMention('BeaverBot')}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-all cursor-pointer group text-left border border-transparent hover:border-indigo-500/30"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-[16px] group-hover:scale-105 transition-transform shadow-inner">
              🤖
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-bold text-[12px] text-white flex items-center gap-1.5">
                @BeaverBot
                <span className="bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                  BOT
                </span>
              </span>
              <span className="text-[10px] text-neutral-400">
                Assign an automated AI coding task
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className="p-3.5 border-t border-white/10 bg-neutral-900/80 backdrop-blur-md shrink-0 relative">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type @BeaverBot to assign a task..."
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={2000}
            className="flex-1 px-3.5 py-2 rounded-xl border border-white/15 bg-neutral-950/80 text-neutral-100 placeholder-neutral-500 font-sans text-xs focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={!inputVal.trim()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_2px_10px_rgba(246,99,23,0.3)] hover:opacity-95 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none`}
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
