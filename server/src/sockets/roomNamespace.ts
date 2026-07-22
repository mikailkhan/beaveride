import { Server as SocketServer } from 'socket.io';
import * as Y from 'yjs';
import { UserRepository } from '../repositories/userRepository.js';
import { AuthService } from '../services/authService.js';
import { ChatRepository } from '../repositories/chatRepository.js';
import { getOrCreateDoc, updateDoc, decrementConnections, getOrCreateFileText, deleteFileText } from './docStore.js';
import { ExecutorService } from '../services/executorService.js';
import { FileService } from '../services/fileService.js';
import { addActivity, getActivities } from './activityStore.js';

import { RoomService } from '../services/roomService.js';

const userRepository = new UserRepository();
const authService = new AuthService();
const chatRepository = new ChatRepository();
const executorService = new ExecutorService();
const fileService = new FileService();
const roomService = new RoomService();
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

      // Load and emit all chat history from database
      const history = await chatRepository.getAllMessages(roomId);
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

      // Relay client-side filetree mutations to other clients in room
      socket.on('filetree:mutate', (data: any) => {
        socket.to(roomChannel).emit('filetree:mutate', data);
      });

      // Handle file tree creation event
      socket.on('filetree:create', async (data: {
        name: string;
        type: 'file' | 'directory';
        parentId?: string;
        content?: string;
      }) => {
        try {
          const parentIdNum = data.parentId ? parseInt(data.parentId, 10) : null;
          const node = await fileService.createFile(
            userId,
            roomId,
            parentIdNum,
            data.name,
            data.type,
            data.content
          );

          if (node.type === 'file') {
            // Eagerly get/create the Y.Text for this file to ensure it's seeded
            getOrCreateFileText(roomId, node.id);
          }

          // Broadcast created event to all peers in the room channel (including sender)
          const mappedNode = {
            id: String(node.id),
            roomId: String(node.roomId),
            parentId: node.parentId !== null ? String(node.parentId) : null,
            name: node.name,
            type: node.type,
            content: node.content,
            createdAt: node.createdAt.toISOString(),
            updatedAt: node.updatedAt.toISOString(),
          };

          roomNsp.to(roomChannel).emit('filetree:created', mappedNode);
        } catch (err) {
          console.error(`Failed to create file node over socket in room ${roomId}:`, err);
          socket.emit('error', err instanceof Error ? err.message : 'Failed to create file');
        }
      });

      // Handle file tree rename event
      socket.on('filetree:rename', async (data: {
        fileId: string;
        newName: string;
      }) => {
        try {
          const fileIdNum = parseInt(data.fileId, 10);
          if (isNaN(fileIdNum)) throw new Error('Invalid fileId');
          await fileService.renameFile(userId, roomId, fileIdNum, data.newName);

          // Broadcast renamed event to all peers
          roomNsp.to(roomChannel).emit('filetree:renamed', {
            fileId: data.fileId,
            newName: data.newName,
          });
        } catch (err) {
          console.error(`Failed to rename file node over socket in room ${roomId}:`, err);
          socket.emit('error', err instanceof Error ? err.message : 'Failed to rename file');
        }
      });

      // Handle file tree delete event
      socket.on('filetree:delete', async (data: {
        fileId: string;
      }) => {
        try {
          const fileIdNum = parseInt(data.fileId, 10);
          if (isNaN(fileIdNum)) throw new Error('Invalid fileId');

          // Retrieve all files in room to compute descendants before deleting
          const allFiles = await fileService.getFileTree(userId, roomId);
          const childrenMap = new Map<string, string[]>();
          for (const f of allFiles) {
            if (f.parentId !== null) {
              const pid = String(f.parentId);
              if (!childrenMap.has(pid)) {
                childrenMap.set(pid, []);
              }
              childrenMap.get(pid)!.push(String(f.id));
            }
          }

          const descendantIds: string[] = [];
          const traverse = (currentId: string) => {
            const children = childrenMap.get(currentId) || [];
            for (const childId of children) {
              traverse(childId);
            }
            descendantIds.push(currentId);
          };
          traverse(data.fileId);

          // Perform deletion in database
          await fileService.deleteFile(userId, roomId, fileIdNum);

          // Also remove any of these deleted file texts from the Yjs document map
          for (const idStr of descendantIds) {
            const idNum = parseInt(idStr, 10);
            if (!isNaN(idNum)) {
              deleteFileText(roomId, idNum);
            }
          }

          // Broadcast deleted event to all peers
          roomNsp.to(roomChannel).emit('filetree:deleted', {
            fileId: data.fileId,
            descendantIds: descendantIds.filter(id => id !== data.fileId),
          });
        } catch (err) {
          console.error(`Failed to delete file node over socket in room ${roomId}:`, err);
          socket.emit('error', err instanceof Error ? err.message : 'Failed to delete file');
        }
      });

      // Handle room member role updates by owner
      socket.on('room:member:update_role', async (data: { targetUserId: number; role: 'owner' | 'editor' | 'viewer'; targetUsername?: string }) => {
        try {
          await roomService.updateMemberRole(userId, roomId, data.targetUserId, data.role);
          const targetName = data.targetUsername || `User ${data.targetUserId}`;
          const roleTitle = data.role.charAt(0).toUpperCase() + data.role.slice(1);
          addActivity(roomId, {
            username,
            event: 'role_changed',
            timestamp: new Date().toISOString(),
            targetUsername: targetName,
            detail: `changed ${targetName}'s role to ${roleTitle}`,
          });
          roomNsp.to(roomChannel).emit('room:member:updated', { targetUserId: data.targetUserId, role: data.role });
          roomNsp.to(roomChannel).emit('activity:update', getActivities(roomId));
        } catch (err) {
          console.error(`Failed to update member role over socket in room ${roomId}:`, err);
          socket.emit('error', err instanceof Error ? err.message : 'Failed to update member role');
        }
      });

      // Handle room member canRun toggle by owner
      socket.on('room:member:toggle_can_run', async (data: { targetUserId: number; canRun: boolean; targetUsername?: string }) => {
        try {
          await roomService.toggleMemberCanRun(userId, roomId, data.targetUserId, data.canRun);
          const targetName = data.targetUsername || `User ${data.targetUserId}`;
          const actionText = data.canRun ? 'enabled' : 'disabled';
          addActivity(roomId, {
            username,
            event: 'run_toggled',
            timestamp: new Date().toISOString(),
            targetUsername: targetName,
            detail: `${actionText} Global Run for ${targetName}`,
          });
          roomNsp.to(roomChannel).emit('room:member:updated', { targetUserId: data.targetUserId, canRun: data.canRun });
          roomNsp.to(roomChannel).emit('activity:update', getActivities(roomId));
        } catch (err) {
          console.error(`Failed to toggle member canRun over socket in room ${roomId}:`, err);
          socket.emit('error', err instanceof Error ? err.message : 'Failed to toggle execution rights');
        }
      });

      // Handle kicking member by owner
      socket.on('room:member:kick', async (data: { targetUserId: number; targetUsername?: string }) => {
        try {
          await roomService.kickMember(userId, roomId, data.targetUserId);
          const targetName = data.targetUsername || `User ${data.targetUserId}`;
          addActivity(roomId, {
            username,
            event: 'kicked',
            timestamp: new Date().toISOString(),
            targetUsername: targetName,
            detail: `kicked ${targetName} from room`,
          });
          // Notify room and activity feed
          roomNsp.to(roomChannel).emit('room:member:kicked', { targetUserId: data.targetUserId });
          roomNsp.to(roomChannel).emit('activity:update', getActivities(roomId));
        } catch (err) {
          console.error(`Failed to kick member over socket in room ${roomId}:`, err);
          socket.emit('error', err instanceof Error ? err.message : 'Failed to kick member');
        }
      });

      // Fetch and emit full database chat history on demand
      socket.on('chat:get_history', async () => {
        try {
          const history = await chatRepository.getAllMessages(roomId);
          socket.emit('chat:history', history);
        } catch (err) {
          console.error(`Failed to fetch chat history in room ${roomId}:`, err);
        }
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
