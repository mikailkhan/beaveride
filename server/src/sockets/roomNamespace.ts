import { Server as SocketServer } from 'socket.io';
import * as Y from 'yjs';
import { UserRepository } from '../repositories/userRepository.js';
import { AuthService } from '../services/authService.js';
import { getOrCreateDoc, updateDoc, decrementConnections } from './docStore.js';

const userRepository = new UserRepository();
const authService = new AuthService();

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
      });
    } catch (err) {
      console.error(`Failed to initialize Yjs document for room ${roomId}:`, err);
      socket.emit('error', 'Failed to load document workspace');
    }

    socket.on('disconnect', async () => {
      console.log(`Socket ${socket.id} disconnected from room namespace (user: ${username})`);
      try {
        await decrementConnections(roomId);
      } catch (err) {
        console.error(`Error decrementing connections on room ${roomId}:`, err);
      }
    });
  });
}
