import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { ActivityEvent, User } from '../types';
import { useFileStore } from '../store/fileStore';
import { useLockStore } from '../store/lockStore';
import type { FileLockInfo } from '../types';

interface UseRoomSocketProps {
  socket: Socket | null;
  authUser: User | null;
  setMyRole: (role: 'owner' | 'editor' | 'viewer') => void;
  setMyCanRun: (canRun: boolean) => void;
  setGlobalRunStatus: (status: 'idle' | 'running' | 'success' | 'error') => void;
  setGlobalOutput: (output: string) => void;
}

export function useRoomSocket({
  socket,
  authUser,
  setMyRole,
  setMyCanRun,
  setGlobalRunStatus,
  setGlobalOutput,
}: UseRoomSocketProps): { activities: ActivityEvent[] } {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const setSocket = useFileStore((state) => state.setSocket);

  // Sync socket state in fileStore and listen to broadcast mutations & member management events
  useEffect(() => {
    if (!socket) return;
    setSocket(socket);

    const currentUserId = authUser?.id;

    const { addNodeFromSocket, renameNodeFromSocket, moveNodeFromSocket, deleteNodeFromSocket } =
      useFileStore.getState();

    const onFiletreeMutate = (data: {
      type: string;
      fileId?: string;
      newName?: string;
      targetParentId?: string | null;
      node?: any;
    }) => {
      if (data.type === 'create' && data.node) {
        addNodeFromSocket(data.node);
      } else if (data.type === 'rename' && data.fileId && data.newName) {
        renameNodeFromSocket(data.fileId, data.newName);
      } else if (data.type === 'move' && data.fileId) {
        moveNodeFromSocket(data.fileId, data.targetParentId ?? null);
      } else if (data.type === 'delete' && data.fileId) {
        deleteNodeFromSocket(data.fileId);
      }
    };

    const onMemberUpdated = (data: {
      targetUserId: number;
      role?: 'owner' | 'editor' | 'viewer';
      canRun?: boolean;
    }) => {
      if (currentUserId && String(data.targetUserId) === String(currentUserId)) {
        if (data.role) setMyRole(data.role);
        if (data.canRun !== undefined) setMyCanRun(data.canRun);
      }
    };

    const onMemberKicked = (data: { targetUserId: number }) => {
      if (currentUserId && String(data.targetUserId) === String(currentUserId)) {
        alert('You have been removed from this room by the owner.');
        window.location.href = '/dashboard';
      }
    };

    socket.on('filetree:mutate', onFiletreeMutate);
    socket.on('room:member:updated', onMemberUpdated);
    socket.on('room:member:kicked', onMemberKicked);

    return () => {
      socket.off('filetree:mutate', onFiletreeMutate);
      socket.off('room:member:updated', onMemberUpdated);
      socket.off('room:member:kicked', onMemberKicked);
      setSocket(null);
    };
  }, [socket, setSocket, authUser, setMyRole, setMyCanRun]);

  // Register socket listeners for global run lifecycle and activities
  useEffect(() => {
    if (!socket) return;

    const onStart = ({ initiatedBy }: { initiatedBy: string }) => {
      setGlobalRunStatus('running');
      setGlobalOutput(`\r\n\x1b[33m[Global Run started by ${initiatedBy}...]\x1b[0m\r\n`);
    };

    const onOutput = ({ chunk }: { chunk: string }) => {
      setGlobalOutput(chunk);
    };

    const onEnd = ({ success }: { success: boolean }) => {
      setGlobalRunStatus(success ? 'success' : 'error');
    };

    const onLocked = ({ message }: { message: string }) => {
      setGlobalOutput(`\r\n\x1b[31m[${message}]\x1b[0m\r\n`);
    };

    const onActivityUpdate = (entries: ActivityEvent[]) => {
      setActivities(entries);
    };

    socket.on('activity:update', onActivityUpdate);
    socket.on('run:global:start', onStart);
    socket.on('run:global:output', onOutput);
    socket.on('run:global:end', onEnd);
    socket.on('run:global:locked', onLocked);

    return () => {
      socket.off('run:global:start', onStart);
      socket.off('run:global:output', onOutput);
      socket.off('run:global:end', onEnd);
      socket.off('run:global:locked', onLocked);
      socket.off('activity:update', onActivityUpdate);
    };
  }, [socket, setGlobalRunStatus, setGlobalOutput]);

  // Register socket listeners for file lock events and heartbeat
  useEffect(() => {
    if (!socket) return;

    const { setLockState, addLock, removeLock, setQueuePosition, removeFromQueue } =
      useLockStore.getState();

    const onLockState = (locks: FileLockInfo[]) => {
      setLockState(locks);
    };

    const onLockAcquired = (lock: FileLockInfo) => {
      addLock(lock);
    };

    const onLockReleased = (data: { fileId: number; lockId: string }) => {
      removeLock(data.fileId, data.lockId);
    };

    const onLockQueued = (data: { fileId: number; position: number; heldBy?: { userId: number; username: string; unitName?: string; lockScope?: 'file' | 'function'; includeUsages?: boolean } }) => {
      setQueuePosition(data.fileId, {
        position: data.position,
        heldBy: data.heldBy,
      });
    };

    const onLockGranted = (data: { fileId: number; lock: FileLockInfo }) => {
      removeFromQueue(data.fileId);
      addLock(data.lock);
    };

    const onUsageAcquired = (data: { groupId: string; locks: FileLockInfo[] }) => {
      for (const lock of data.locks) {
        addLock(lock);
      }
      const lockIds = data.locks.map(l => l.id);
      useLockStore.getState().addUsageGroup(data.groupId, lockIds);
    };

    const onUsageQueued = (data: {
      fileId: number;
      groupId: string;
      position: number;
      blockedBy?: Array<{ fileId: number; userId: number; username: string }>;
    }) => {
      const firstBlocker = data.blockedBy && data.blockedBy.length > 0 ? data.blockedBy[0] : undefined;
      setQueuePosition(data.fileId, {
        position: data.position,
        heldBy: firstBlocker ? { userId: firstBlocker.userId, username: firstBlocker.username, lockScope: 'function', includeUsages: true } : undefined,
      });
    };

    socket.on('lock:state', onLockState);
    socket.on('lock:acquired', onLockAcquired);
    socket.on('lock:released', onLockReleased);
    socket.on('lock:queued', onLockQueued);
    socket.on('lock:granted', onLockGranted);
    socket.on('lock:usage-acquired', onUsageAcquired);
    socket.on('lock:usage-queued', onUsageQueued);

    return () => {
      socket.off('lock:state', onLockState);
      socket.off('lock:acquired', onLockAcquired);
      socket.off('lock:released', onLockReleased);
      socket.off('lock:queued', onLockQueued);
      socket.off('lock:granted', onLockGranted);
      socket.off('lock:usage-acquired', onUsageAcquired);
      socket.off('lock:usage-queued', onUsageQueued);
    };
  }, [socket]);

  // Send lock heartbeats every 10 seconds
  useEffect(() => {
    if (!socket || !authUser) return;

    const intervalId = setInterval(() => {
      const { fileLocks } = useLockStore.getState();
      const currentUserId = Number(authUser.id);

      for (const [fileId, locks] of fileLocks.entries()) {
        const hasMyLock = locks.some(l => l.userId === currentUserId);
        if (hasMyLock) {
          socket.emit('lock:heartbeat', { fileId });
        }
      }
    }, 10_000);

    return () => clearInterval(intervalId);
  }, [socket, authUser]);

  return { activities };
}
