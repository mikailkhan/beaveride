import { Server as SocketServer } from 'socket.io';
import { UserRepository } from '../repositories/userRepository.js';
import { AuthService } from '../services/authService.js';

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

  roomNsp.on('connection', (socket) => {
    const { userId, username, roomId } = socket.data;
    console.log(`Socket ${socket.id} connected to room namespace (user: ${username}, id: ${userId})`);

    const roomChannel = `room:${roomId}`;
    socket.join(roomChannel);
    console.log(`Socket ${socket.id} joined channel ${roomChannel}`);

    // Emit confirmation
    socket.emit('room:joined', { userId, username, roomId });

    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected from room namespace (user: ${username})`);
    });
  });
}
