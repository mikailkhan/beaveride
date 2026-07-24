import { Server as HttpServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { env } from '../config/env.js';
import { registerRoomNamespace } from './roomNamespace.js';

let io: SocketServer | null = null;

export function createSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  registerRoomNamespace(io);

  io.on('connection', (socket) => {
    console.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketServer(): SocketServer {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized. Call createSocketServer first.');
  }
  return io;
}
