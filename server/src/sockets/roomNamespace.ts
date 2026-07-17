import { Server as SocketServer } from 'socket.io';
import * as Y from 'yjs';
import { UserRepository } from '../repositories/userRepository.js';
import { AuthService } from '../services/authService.js';
import { ChatRepository } from '../repositories/chatRepository.js';
import { getOrCreateDoc, updateDoc, decrementConnections } from './docStore.js';
import { ExecutorService } from '../services/executorService.js';
import { addActivity, getActivities } from './activityStore.js';

const userRepository = new UserRepository();
const authService = new AuthService();
const chatRepository = new ChatRepository();
const executorService = new ExecutorService();
const globalRunLock = new Map<number, boolean>();
const codeEditDebounce = new Map<string, number>(); // key: `${roomId}:${userId}`
const CODE_EDIT_DEBOUNCE_MS = 10_000;

export function registerRoomNamespace(io: SocketServer): void {
  const roomNsp = io.of('/room');

  roomNsp.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth;
      const token = auth?.token;
      const roomIdStr = auth?.roomId;

      if (!token || !roomIdStr) {
        return next(new Error('Unauthorized: Token and roomId are required'));
      }

      const roomId = parseInt(roomIdStr, 10);
      if (isNaN(roomId)) {
        return next(new Error('Unauthorized: Invalid roomId'));
      }

      // Verify JWT token using the AuthService
      const decoded = authService.verifyToken(token);
      if (!decoded || !decoded.sub) {
        return next(new Error('Unauthorized: Invalid token payload'));
      }

      // Retrieve user from DB to get the verified username
      const user = await userRepository.findById(decoded.sub);
      if (!user) {
        return next(new Error('Unauthorized: User not found'));
      }

      // Populate socket data
      socket.data.userId = user.id;
      socket.data.username = user.username;
      socket.data.roomId = roomId;

      next();
    } catch (err) {
      next(new Error('Unauthorized: ' + (err instanceof Error ? err.message : 'Invalid session')));
    }
  });

  roomNsp.on('connection', async (socket) => {
    const { userId, username, roomId } = socket.data;
    console.log(`Socket ${socket.id} connected to room namespace (user: ${username}, id: ${userId})`);

    const roomChannel = `room:${roomId}`;
    socket.join(roomChannel);
    console.log(`Socket ${socket.id} joined channel ${roomChannel}`);

    try {
      // Load or create Y.Doc state for this room
      const doc = await getOrCreateDoc(roomId);

      // Emit confirmation
      socket.emit('room:joined', { userId, username, roomId });

      // Add joined activity log and broadcast updates
      addActivity(roomId, { username, event: 'joined', timestamp: new Date().toISOString() });
      roomNsp.to(roomChannel).emit('activity:update', getActivities(roomId));
      socket.emit('activity:update', getActivities(roomId));

      // Load and emit chat history
      const history = await chatRepository.getRecentMessages(roomId, 50);
      socket.emit('chat:history', history);

      // Handle initial document sync request
      socket.on('sync:init', () => {
        const stateUpdate = Y.encodeStateAsUpdate(doc);
        socket.emit('sync:init', stateUpdate);
      });

      // Handle document updates
      socket.on('sync:update', (update: Uint8Array) => {
        updateDoc(roomId, update, userId);
        // Relay the update to all other users in the room
        socket.to(roomChannel).emit('sync:update', update);

        // Record a code_edit activity with a 10s debounce per user
        const debounceKey = `${roomId}:${userId}`;
        const lastEdit = codeEditDebounce.get(debounceKey) ?? 0;
        const now = Date.now();
        if (now - lastEdit > CODE_EDIT_DEBOUNCE_MS) {
          codeEditDebounce.set(debounceKey, now);
          addActivity(roomId, { username, event: 'code_edit', timestamp: new Date().toISOString() });
          roomNsp.to(roomChannel).emit('activity:update', getActivities(roomId));
        }
      });

      // Handle awareness updates (cursors, selections)
      socket.on('sync:awareness', (update: Uint8Array) => {
        socket.to(roomChannel).emit('sync:awareness', update);
      });

      // Handle incoming chat messages
      socket.on('chat:send', async (data: { message: string }) => {
        const messageText = data?.message?.trim();
        if (!messageText || messageText.length > 2000) return;
        try {
          const chatMsg = await chatRepository.insertMessage(roomId, userId, messageText);
          // Broadcast to all clients in the room including the sender
          roomNsp.to(roomChannel).emit('chat:message', chatMsg);
        } catch (err) {
          console.error(`Failed to save chat message in room ${roomId}:`, err);
        }
      });

      // Handle global code run requests with mutex locking
      socket.on('run:global', async (data: { code: string; language: string }) => {
        if (globalRunLock.get(roomId)) {
          socket.emit('run:global:locked', { message: 'A global execution is already in progress.' });
          return;
        }
        
        globalRunLock.set(roomId, true);
        addActivity(roomId, { username, event: 'global_run', timestamp: new Date().toISOString() });
        roomNsp.to(roomChannel).emit('activity:update', getActivities(roomId));
        roomNsp.to(roomChannel).emit('run:global:start', { initiatedBy: username });

        try {
          const resultOutput = await executorService.executeCode(data.language, data.code);
          roomNsp.to(roomChannel).emit('run:global:output', { chunk: resultOutput });
          roomNsp.to(roomChannel).emit('run:global:end', { success: true });
        } catch (err) {
          roomNsp.to(roomChannel).emit('run:global:output', {
            chunk: `Execution Error: ${(err as Error).message}`,
          });
          roomNsp.to(roomChannel).emit('run:global:end', { success: false });
        } finally {
          globalRunLock.delete(roomId);
        }
      });
    } catch (err) {
      console.error(`Failed to initialize Yjs document for room ${roomId}:`, err);
      socket.emit('error', 'Failed to load document workspace');
    }

    socket.on('disconnect', async () => {
      console.log(`Socket ${socket.id} disconnected from room namespace (user: ${username})`);
      try {
        await decrementConnections(roomId);
        addActivity(roomId, { username, event: 'left', timestamp: new Date().toISOString() });
        roomNsp.to(roomChannel).emit('activity:update', getActivities(roomId));
        codeEditDebounce.delete(`${roomId}:${userId}`);
      } catch (err) {
        console.error(`Error decrementing connections on room ${roomId}:`, err);
      }
    });
  });
}
