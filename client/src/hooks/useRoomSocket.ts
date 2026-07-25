import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { ActivityEntry, User } from '../types';
import { useFileStore } from '../store/fileStore';

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
}: UseRoomSocketProps): { activities: ActivityEntry[] } {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
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

    const onActivityUpdate = (entries: ActivityEntry[]) => {
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

  return { activities };
}
