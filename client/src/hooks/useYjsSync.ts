import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { io, Socket } from 'socket.io-client';

interface UseYjsSyncProps {
  roomId: string;
  token: string;
  editor: any;
}

export function useYjsSync({ roomId, token, editor }: UseYjsSyncProps): { isConnected: boolean; error: string | null } {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  useEffect(() => {
    if (!roomId || !token) return;

    // Initialize Yjs Document
    const doc = new Y.Doc();
    docRef.current = doc;

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
      // Initiate sync sequence
      socket.emit('sync:init');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    socket.on('sync:init', (stateUpdate: ArrayBuffer | Uint8Array) => {
      console.log('Received initial document sync snapshot');
      Y.applyUpdate(doc, new Uint8Array(stateUpdate));
    });

    socket.on('sync:update', (update: ArrayBuffer | Uint8Array) => {
      Y.applyUpdate(doc, new Uint8Array(update));
    });

    // Listen for local changes to the doc and emit updates to the server
    const handleDocUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== 'remote' && socket.connected) {
        socket.emit('sync:update', update);
      }
    };
    doc.on('update', handleDocUpdate);

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      console.log('Cleaning up Yjs Sync connection...');
      doc.off('update', handleDocUpdate);
      socket.disconnect();
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      doc.destroy();
      docRef.current = null;
      socketRef.current = null;
    };
  }, [roomId, token]);

  // Bind the Yjs document to Monaco once the editor is loaded
  useEffect(() => {
    if (!editor || !docRef.current) return;

    const doc = docRef.current;
    const yText = doc.getText('content');
    const model = editor.getModel();

    if (!model) {
      console.warn('Monaco editor has no text model, delaying Yjs binding');
      return;
    }

    console.log('Binding Yjs doc to Monaco text model');
    
    // Create new binding
    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      null // Ephemeral awareness data will be wired in Step 5
    );
    bindingRef.current = binding;

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [editor]);

  return { isConnected, error };
}
