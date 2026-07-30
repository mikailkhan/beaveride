import { Server as SocketServer } from 'socket.io';
import * as Y from 'yjs';
import { UserRepository } from '../repositories/userRepository.js';
import { AuthService } from '../services/authService.js';
import { ChatRepository } from '../repositories/chatRepository.js';
import { getOrCreateDoc, updateDoc, decrementConnections, getOrCreateFileText, deleteFileText } from './docStore.js';
import { ExecutorService } from '../services/executorService.js';
import { FileService } from '../services/fileService.js';
import { eventService } from '../services/eventService.js';
import { buildProjectPayload } from '../utils/filePathUtils.js';

import { RoomService } from '../services/roomService.js';
import { RoomRepository } from '../repositories/roomRepository.js';
import {
  acquireLock,
  releaseLock,
  refreshHeartbeat,
  releaseAllLocksForSocket,
  getLocksForRoom,
  getExpiredLocks,
  adjustLockSpansOnEdit,
} from './lockStore.js';

const userRepository = new UserRepository();
const authService = new AuthService();
const chatRepository = new ChatRepository();
const executorService = new ExecutorService();
const fileService = new FileService();
const roomService = new RoomService();
const roomRepository = new RoomRepository();
const globalRunLock = new Map<number, boolean>();
const codeEditDebounce = new Map<string, number>(); // key: `${roomId}:${userId}`
const CODE_EDIT_DEBOUNCE_MS = 10_000;
const lockCorrelations = new Map<string, string>(); // lockId -> correlationId

export function registerRoomNamespace(io: SocketServer): void {
  const roomNsp = io.of('/room');

  const broadcastActivities = async (roomId: number) => {
    try {
      const activities = await eventService.getLiveActivity(roomId);
      roomNsp.to(`room:${roomId}`).emit('activity:update', activities);
    } catch (err) {
      console.error(`Failed to broadcast live activities for room ${roomId}:`, err);
    }
  };

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
    console.info(`Socket ${socket.id} connected to room namespace (user: ${username}, id: ${userId})`);

    const roomChannel = `room:${roomId}`;
    socket.join(roomChannel);
    console.info(`Socket ${socket.id} joined channel ${roomChannel}`);

    // Eagerly initiate async document loading and chat history fetching
    const docPromise = getOrCreateDoc(roomId);
    const historyPromise = chatRepository.getAllMessages(roomId);

    // Register all socket event listeners SYNCHRONOUSLY to prevent missed client events
    socket.on('sync:init', async () => {
      try {
        const doc = await docPromise;
        const stateUpdate = Y.encodeStateAsUpdate(doc);
        socket.emit('sync:init', stateUpdate);
      } catch (err) {
        console.error(`Failed to handle sync:init for room ${roomId}:`, err);
      }
    });

    socket.on('sync:update', async (update: Uint8Array, fileId?: number | string) => {
      try {
        await docPromise;
        updateDoc(roomId, update, userId);
        // Relay the update to all other users in the room
        socket.to(roomChannel).emit('sync:update', update);

        const targetFileId = fileId ? Number(fileId) : undefined;

        // Record a code_edit activity with a 10s debounce per user
        const debounceKey = `${roomId}:${userId}`;
        const lastEdit = codeEditDebounce.get(debounceKey) ?? 0;
        const now = Date.now();
        if (now - lastEdit > CODE_EDIT_DEBOUNCE_MS) {
          codeEditDebounce.set(debounceKey, now);
          eventService.emit({
            roomId,
            actorId: userId,
            actorName: username,
            actorType: 'human',
            eventType: 'code_edited',
            targetFileId,
            outcome: 'completed',
          });
          await broadcastActivities(roomId);
        }
      } catch (err) {
        console.error(`Failed to process sync:update for room ${roomId}:`, err);
      }
    });

    socket.on('sync:awareness', (update: Uint8Array) => {
      socket.to(roomChannel).emit('sync:awareness', update);
    });

    // Handle room initialization asynchronously
    (async () => {
      try {
        const doc = await docPromise;

        // Emit room joined confirmation and eager doc sync state
        socket.emit('room:joined', { userId, username, roomId });

        const stateUpdate = Y.encodeStateAsUpdate(doc);
        socket.emit('sync:init', stateUpdate);

        // Add joined activity log and broadcast updates
        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'participant_joined',
          outcome: 'completed',
        });
        await broadcastActivities(roomId);

        // Send current lock state for the room
        const roomLocks = getLocksForRoom(roomId);
        socket.emit('lock:state', roomLocks);

        // Load and emit all chat history from database
        const history = await historyPromise;
        socket.emit('chat:history', history);
      } catch (err) {
        console.error(`Failed to initialize Yjs document for room ${roomId}:`, err);
        socket.emit('error', 'Failed to load document workspace');
      }
    })();

    // Relay client-side filetree mutations to other clients in room with field whitelist validation
    socket.on('filetree:mutate', (data: unknown) => {
      if (typeof data !== 'object' || data === null) return;
      const d = data as Record<string, unknown>;
      const sanitized = {
        type: typeof d.type === 'string' ? d.type : undefined,
        fileId: typeof d.fileId === 'string' ? d.fileId : undefined,
        newName: typeof d.newName === 'string' ? d.newName : undefined,
        targetParentId: d.targetParentId === null || typeof d.targetParentId === 'string' ? d.targetParentId : undefined,
        node: typeof d.node === 'object' ? d.node : undefined,
      };
      socket.to(roomChannel).emit('filetree:mutate', sanitized);
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

        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'file_created',
          targetFileId: node.id,
          outcome: 'completed',
          metadata: { name: node.name, type: node.type },
        });
        await broadcastActivities(roomId);

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

        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'file_renamed',
          targetFileId: fileIdNum,
          outcome: 'completed',
          metadata: { newName: data.newName },
        });
        await broadcastActivities(roomId);

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

    // Handle file tree move event
    socket.on('filetree:move', async (data: {
      fileId: string;
      targetParentId: string | null;
    }) => {
      try {
        const fileIdNum = parseInt(data.fileId, 10);
        const targetParentIdNum = data.targetParentId !== null ? parseInt(data.targetParentId, 10) : null;
        if (isNaN(fileIdNum)) throw new Error('Invalid fileId');
        await fileService.moveFile(userId, roomId, fileIdNum, targetParentIdNum);

        // Broadcast moved event to all peers
        roomNsp.to(roomChannel).emit('filetree:moved', {
          fileId: data.fileId,
          targetParentId: data.targetParentId,
        });
      } catch (err) {
        console.error(`Failed to move file node over socket in room ${roomId}:`, err);
        socket.emit('error', err instanceof Error ? err.message : 'Failed to move file');
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

        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'file_deleted',
          targetFileId: fileIdNum,
          outcome: 'completed',
        });
        await broadcastActivities(roomId);

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
        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'member_role_changed',
          outcome: 'completed',
          metadata: { targetUserId: data.targetUserId, role: data.role, targetUsername: targetName, detail: `changed ${targetName}'s role to ${roleTitle}` },
        });
        roomNsp.to(roomChannel).emit('room:member:updated', { targetUserId: data.targetUserId, role: data.role });
        await broadcastActivities(roomId);
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
        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'member_run_toggled',
          outcome: 'completed',
          metadata: { targetUserId: data.targetUserId, canRun: data.canRun, targetUsername: targetName, detail: `${actionText} Global Run for ${targetName}` },
        });
        roomNsp.to(roomChannel).emit('room:member:updated', { targetUserId: data.targetUserId, canRun: data.canRun });
        await broadcastActivities(roomId);
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
        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'member_kicked',
          outcome: 'completed',
          metadata: { targetUserId: data.targetUserId, targetUsername: targetName, detail: `kicked ${targetName} from room` },
        });
        // Notify room and activity feed
        roomNsp.to(roomChannel).emit('room:member:kicked', { targetUserId: data.targetUserId });
        await broadcastActivities(roomId);
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

    // Lock handlers
    socket.on('lock:acquire', async (data: { fileId: number; lockScope?: 'file' | 'function'; startLine?: number; endLine?: number; unitName?: string }) => {
      const scope = data.lockScope === 'function' ? 'function' : 'file';
      const correlationId = eventService.generateCorrelationId();
      const result = acquireLock(roomId, data.fileId, userId, username, socket.id, scope, data.startLine, data.endLine, data.unitName);

      if (result.status === 'acquired') {
        lockCorrelations.set(result.lock.id, correlationId);
        roomNsp.to(roomChannel).emit('lock:acquired', result.lock);

        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'lock_granted',
          targetFileId: data.fileId,
          targetScope: scope,
          targetUnitName: data.unitName,
          outcome: 'granted',
          correlationId,
          metadata: { startLine: data.startLine, endLine: data.endLine, unitName: data.unitName },
        });
        await broadcastActivities(roomId);
      } else if (result.status === 'queued') {
        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'lock_requested',
          targetFileId: data.fileId,
          targetScope: scope,
          targetUnitName: data.unitName,
          correlationId,
        });

        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'lock_queued',
          targetFileId: data.fileId,
          targetScope: scope,
          targetUnitName: data.unitName,
          outcome: 'queued',
          correlationId,
          metadata: { position: result.position, heldBy: result.heldBy, unitName: data.unitName },
        });
        await broadcastActivities(roomId);

        socket.emit('lock:queued', {
          fileId: data.fileId,
          position: result.position,
          heldBy: result.heldBy,
        });
      } else if (result.status === 'already_held') {
        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'lock_denied',
          targetFileId: data.fileId,
          targetScope: scope,
          targetUnitName: data.unitName,
          outcome: 'denied',
          reason: 'overlap_conflict',
          correlationId,
        });
        await broadcastActivities(roomId);

        socket.emit('lock:already_held', { fileId: data.fileId });
      }
    });

    socket.on('lock:release', async (data: { fileId: number; lockId: string }) => {
      const lockCorrelationId = lockCorrelations.get(data.lockId);
      const result = releaseLock(roomId, data.fileId, userId, data.lockId);

      if (result.status === 'released') {
        lockCorrelations.delete(data.lockId);
        roomNsp.to(roomChannel).emit('lock:released', { fileId: data.fileId, lockId: data.lockId, releasedBy: userId });

        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'lock_released_explicit',
          targetFileId: data.fileId,
          targetScope: result.lock.lockScope,
          targetUnitName: result.lock.unitName,
          outcome: 'completed',
          correlationId: lockCorrelationId,
        });
        await broadcastActivities(roomId);

        if (result.nextInQueue && result.nextInQueue.length > 0) {
          for (const next of result.nextInQueue) {
            const nextCorrelationId = eventService.generateCorrelationId();
            const grantResult = acquireLock(roomId, data.fileId, next.userId, next.username, next.socketId, next.lockScope, next.startLine, next.endLine, next.unitName);
            if (grantResult.status === 'acquired') {
              lockCorrelations.set(grantResult.lock.id, nextCorrelationId);

              eventService.emit({
                roomId,
                actorId: next.userId,
                actorName: next.username,
                actorType: 'human',
                eventType: 'lock_queue_promoted',
                targetFileId: data.fileId,
                targetScope: next.lockScope,
                targetUnitName: next.unitName,
                outcome: 'promoted',
                correlationId: nextCorrelationId,
              });

              eventService.emit({
                roomId,
                actorId: next.userId,
                actorName: next.username,
                actorType: 'human',
                eventType: 'lock_granted',
                targetFileId: data.fileId,
                targetScope: next.lockScope,
                targetUnitName: next.unitName,
                outcome: 'granted',
                correlationId: nextCorrelationId,
              });
              await broadcastActivities(roomId);

              roomNsp.to(next.socketId).emit('lock:granted', {
                fileId: data.fileId,
                lock: grantResult.lock,
              });
              roomNsp.to(roomChannel).emit('lock:acquired', grantResult.lock);
            }
          }
        }
      }
    });

    socket.on('lock:heartbeat', (data: { fileId: number }) => {
      refreshHeartbeat(roomId, data.fileId, userId);
    });

    // Handle global code run requests with mutex locking
    socket.on('run:global', async (data: { entryFileId?: string; language: string; code?: string }) => {
      // Re-validate canRun permission from DB — awareness state is client-controlled
      const membership = await roomRepository.findMembership(roomId, userId);
      if (!membership || !membership.canRun) {
        socket.emit('run:global:output', { chunk: 'Error: You do not have execution privileges in this room.' });
        socket.emit('run:global:end', { success: false });
        return;
      }

      // Block global run if the entry file is locked by another user
      if (data.entryFileId) {
        const entryFileIdNum = parseInt(data.entryFileId, 10);
        if (!isNaN(entryFileIdNum)) {
          const roomLocks = getLocksForRoom(roomId);
          const entryLock = roomLocks.find((l) => l.fileId === entryFileIdNum);
          if (entryLock && entryLock.userId !== userId) {
            socket.emit('run:global:output', {
              chunk: `Error: File is locked by ${entryLock.username}. Cannot run while file is locked by another user.`,
            });
            socket.emit('run:global:end', { success: false });
            return;
          }
        }
      }

      if (globalRunLock.get(roomId)) {
        socket.emit('run:global:locked', { message: 'A global execution is already in progress.' });
        return;
      }
      
      globalRunLock.set(roomId, true);
      eventService.emit({
        roomId,
        actorId: userId,
        actorName: username,
        actorType: 'human',
        eventType: 'global_run_started',
        outcome: 'completed',
      });
      await broadcastActivities(roomId);

      roomNsp.to(roomChannel).emit('run:global:start', { initiatedBy: username });

      try {
        const allFiles = await fileService.getFileTree(userId, roomId);
        const yDoc = await getOrCreateDoc(roomId);
        const yFilesMap = yDoc.getMap('files');

        const { payload: projectPayload, entryFilePath } = buildProjectPayload(allFiles, yFilesMap, data.entryFileId);

        const resultOutput = await executorService.executeProject(
          data.language,
          projectPayload,
          entryFilePath
        );
        roomNsp.to(roomChannel).emit('run:global:output', { chunk: resultOutput });
        roomNsp.to(roomChannel).emit('run:global:end', { success: true });
        
        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'global_run_ended',
          outcome: 'completed',
        });
        await broadcastActivities(roomId);
      } catch (err) {
        roomNsp.to(roomChannel).emit('run:global:output', {
          chunk: `Execution Error: ${(err as Error).message}`,
        });
        roomNsp.to(roomChannel).emit('run:global:end', { success: false });

        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'global_run_ended',
          outcome: 'failed',
          reason: 'execution_error',
        });
        await broadcastActivities(roomId);
      } finally {
        globalRunLock.delete(roomId);
      }
    });

    socket.on('disconnect', async () => {
      console.info(`Socket ${socket.id} disconnected from room namespace (user: ${username})`);
      try {
        // Auto-release any file locks held by this disconnecting socket
        const releasedLocks = releaseAllLocksForSocket(socket.id);
        for (const released of releasedLocks) {
          const releasedRoomChannel = `room:${released.roomId}`;
          const lockCorrId = lockCorrelations.get(released.lock.id);
          lockCorrelations.delete(released.lock.id);

          roomNsp.to(releasedRoomChannel).emit('lock:released', {
            fileId: released.fileId,
            lockId: released.lock.id,
            releasedBy: released.lock.userId,
            reason: 'disconnect',
          });

          eventService.emit({
            roomId: released.roomId,
            actorId: released.lock.userId,
            actorName: released.lock.username,
            actorType: 'human',
            eventType: 'lock_released_disconnect',
            targetFileId: released.fileId,
            targetScope: released.lock.lockScope,
            outcome: 'revoked',
            reason: 'disconnect',
            correlationId: lockCorrId,
          });
          await broadcastActivities(released.roomId);

          // Auto-grant to next in queue
          if (released.nextInQueue && released.nextInQueue.length > 0) {
            for (const next of released.nextInQueue) {
              const nextCorrelationId = eventService.generateCorrelationId();
              const grantResult = acquireLock(released.roomId, released.fileId, next.userId, next.username, next.socketId, next.lockScope, next.startLine, next.endLine);
              if (grantResult.status === 'acquired') {
                lockCorrelations.set(grantResult.lock.id, nextCorrelationId);

                eventService.emit({
                  roomId: released.roomId,
                  actorId: next.userId,
                  actorName: next.username,
                  actorType: 'human',
                  eventType: 'lock_queue_promoted',
                  targetFileId: released.fileId,
                  targetScope: next.lockScope,
                  outcome: 'promoted',
                  correlationId: nextCorrelationId,
                });

                eventService.emit({
                  roomId: released.roomId,
                  actorId: next.userId,
                  actorName: next.username,
                  actorType: 'human',
                  eventType: 'lock_granted',
                  targetFileId: released.fileId,
                  targetScope: next.lockScope,
                  outcome: 'granted',
                  correlationId: nextCorrelationId,
                });
                await broadcastActivities(released.roomId);

                roomNsp.to(next.socketId).emit('lock:granted', {
                  fileId: released.fileId,
                  lock: grantResult.lock,
                });
                roomNsp.to(releasedRoomChannel).emit('lock:acquired', grantResult.lock);
              }
            }
          }
        }

        await decrementConnections(roomId);

        eventService.emit({
          roomId,
          actorId: userId,
          actorName: username,
          actorType: 'human',
          eventType: 'participant_left',
          outcome: 'completed',
        });
        await broadcastActivities(roomId);

        codeEditDebounce.delete(`${roomId}:${userId}`);
      } catch (err) {
        console.error(`Error decrementing connections on room ${roomId}:`, err);
      }
    });
  });

  // Sweep for expired locks every 10 seconds
  setInterval(async () => {
    const expired = getExpiredLocks();
    for (const { roomId: eRoomId, fileId: eFileId, lock } of expired) {
      const lockCorrId = lockCorrelations.get(lock.id);
      lockCorrelations.delete(lock.id);
      const result = releaseLock(eRoomId, eFileId, lock.userId, lock.id);

      if (result.status === 'released') {
        const channel = `room:${eRoomId}`;
        roomNsp.to(channel).emit('lock:released', {
          fileId: eFileId,
          lockId: lock.id,
          releasedBy: lock.userId,
          reason: 'timeout',
        });

        eventService.emit({
          roomId: eRoomId,
          actorId: lock.userId,
          actorName: lock.username,
          actorType: 'human',
          eventType: 'lock_released_idle_timeout',
          targetFileId: eFileId,
          targetScope: lock.lockScope,
          outcome: 'expired',
          reason: 'idle_timeout',
          correlationId: lockCorrId,
        });
        await broadcastActivities(eRoomId);

        // Auto-grant next in queue
        if (result.nextInQueue && result.nextInQueue.length > 0) {
          for (const next of result.nextInQueue) {
            const nextCorrelationId = eventService.generateCorrelationId();
            const grantResult = acquireLock(eRoomId, eFileId, next.userId, next.username, next.socketId, next.lockScope, next.startLine, next.endLine);
            if (grantResult.status === 'acquired') {
              lockCorrelations.set(grantResult.lock.id, nextCorrelationId);

              eventService.emit({
                roomId: eRoomId,
                actorId: next.userId,
                actorName: next.username,
                actorType: 'human',
                eventType: 'lock_queue_promoted',
                targetFileId: eFileId,
                targetScope: next.lockScope,
                outcome: 'promoted',
                correlationId: nextCorrelationId,
              });

              eventService.emit({
                roomId: eRoomId,
                actorId: next.userId,
                actorName: next.username,
                actorType: 'human',
                eventType: 'lock_granted',
                targetFileId: eFileId,
                targetScope: next.lockScope,
                outcome: 'granted',
                correlationId: nextCorrelationId,
              });
              await broadcastActivities(eRoomId);

              roomNsp.to(next.socketId).emit('lock:granted', {
                fileId: eFileId,
                lock: grantResult.lock,
              });
              roomNsp.to(channel).emit('lock:acquired', grantResult.lock);
            }
          }
        }
      }
    }
  }, 10_000);
}
