import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { io, Socket } from 'socket.io-client';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { useAuthStore } from '../store/authStore';

interface UseYjsSyncProps {
  roomId: string;
  token: string;
}

export interface Collaborator {
  clientId: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  color: string;
  activeFileId: string | null;
  role?: 'owner' | 'editor' | 'viewer';
  canRun?: boolean;
}

const getRandomColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 85%, 40%)`; // Bright, high-contrast, premium color palette
};

export function useYjsSync({ roomId, token }: UseYjsSyncProps): {
  isConnected: boolean;
  isSynced: boolean;
  error: string | null;
  collaborators: Collaborator[];
  socket: Socket | null;
  doc: Y.Doc | null;
  awareness: Awareness | null;
} {
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);

  const authUser = useAuthStore((state) => state.user);
  const username = authUser?.username || 'Anonymous';
  const userId = authUser?.id || 0;

  useEffect(() => {
    if (!roomId || !token) return;

    // Initialize Yjs Document & Awareness
    const doc = new Y.Doc();
    docRef.current = doc;

    const awareness = new Awareness(doc);
    awarenessRef.current = awareness;

    // Set local presence state details
    awareness.setLocalStateField('user', {
      userId,
      name: username,
      firstName: authUser?.firstName || username,
      lastName: authUser?.lastName || '',
      color: getRandomColor(),
    });

    const socketUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
    const socket = io(`${socketUrl}/room`, {
      auth: {
        token,
        roomId,
      },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Successfully connected to Room namespace, socket id:', socket.id);
      // Initiate sync sequences
      socket.emit('sync:init');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    // Handle document states sync
    socket.on('sync:init', (stateUpdate: ArrayBuffer | Uint8Array) => {
      console.log('Received initial document sync snapshot');
      Y.applyUpdate(doc, new Uint8Array(stateUpdate));
      setIsSynced(true);
    });

    socket.on('sync:update', (update: ArrayBuffer | Uint8Array) => {
      Y.applyUpdate(doc, new Uint8Array(update));
    });

    // Handle awareness sync
    socket.on('sync:awareness', (update: ArrayBuffer | Uint8Array) => {
      applyAwarenessUpdate(awareness, new Uint8Array(update), 'remote');
    });

    // Broadcast local doc edits
    const handleDocUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== 'remote' && socket.connected) {
        socket.emit('sync:update', update);
      }
    };
    doc.on('update', handleDocUpdate);

    // Broadcast local awareness (cursor, selection, file) updates
    const handleAwarenessUpdate = ({ added, updated, removed }: any) => {
      const changes = [...added, ...updated, ...removed];
      const update = encodeAwarenessUpdate(awareness, changes);
      if (socket.connected) {
        socket.emit('sync:awareness', update);
      }
    };
    awareness.on('update', handleAwarenessUpdate);

    // Update active collaborators list and inject dynamic client styles
    const handleAwarenessChange = () => {
      const states = Array.from(awareness.getStates().entries());
      
      let styleText = '';
      states.forEach(([clientId, state]) => {
        const user = state.user;
        if (user) {
          const color = user.color || '#f66317';
          const name = user.name || 'Anonymous';
          
          styleText += `
            /* Selection background */
            .yRemoteSelection-${clientId} {
              background-color: ${color} !important;
              opacity: 0.25;
            }
            /* Cursor line and blinking animation with smooth glide */
            .yRemoteSelectionHead-${clientId} {
              position: absolute;
              box-sizing: border-box;
              border-left: 2px solid ${color} !important;
              height: 100%;
              transition: all 0.08s cubic-bezier(0.16, 1, 0.3, 1);
              animation: yRemoteSelectionHead-blink 1s step-end infinite;
            }
            /* Username label tag showing permanently */
            .yRemoteSelectionHead-${clientId}::after {
              content: "${name}";
              position: absolute;
              background-color: ${color};
              color: white;
              font-size: 9px;
              font-family: Inter, sans-serif;
              font-weight: 700;
              padding: 1px 4px;
              border-radius: 2px;
              top: -16px;
              left: -1px;
              pointer-events: none;
              white-space: nowrap;
              z-index: 101;
              line-height: normal;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
          `;
        }
      });

      let styleEl = document.getElementById('yjs-awareness-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'yjs-awareness-styles';
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = styleText;

      const seen = new Set<number>();
      const collabs: Collaborator[] = [];
      states.forEach(([clientId, state]) => {
        const uId = state.user?.userId;
        if (uId) {
          if (!seen.has(uId)) {
            seen.add(uId);
            collabs.push({
              clientId,
              userId: uId,
              username: state.user?.name || 'Anonymous',
              firstName: state.user?.firstName || 'Anonymous',
              lastName: state.user?.lastName || '',
              color: state.user?.color || '#f66317',
              activeFileId: state.activeFileId || null,
              role: state.role || state.user?.role || 'editor',
              canRun: state.canRun !== undefined ? state.canRun : (state.user?.canRun !== undefined ? state.user?.canRun : true),
            });
          }
        }
      });
      setCollaborators(collabs);
    };
    awareness.on('change', handleAwarenessChange);

    // Initialize list with current local state
    handleAwarenessChange();

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsSynced(false);
    });

    return () => {
      console.log('Cleaning up Yjs Sync & Awareness connection...');
      doc.off('update', handleDocUpdate);
      awareness.off('update', handleAwarenessUpdate);
      awareness.off('change', handleAwarenessChange);
      socket.disconnect();
      const styleEl = document.getElementById('yjs-awareness-styles');
      if (styleEl) {
        styleEl.remove();
      }
      doc.destroy();
      docRef.current = null;
      awarenessRef.current = null;
      socketRef.current = null;
    };
  }, [roomId, token, userId, username, authUser]);

  return {
    isConnected,
    isSynced,
    error,
    collaborators,
    socket: socketRef.current,
    doc: docRef.current,
    awareness: awarenessRef.current,
  };
}
