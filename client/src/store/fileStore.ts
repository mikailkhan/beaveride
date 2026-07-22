import { create } from 'zustand';
import type { ProjectFile, FileTab } from '../types';
import { fileService } from '../services/fileService.js';

interface FileState {
  files: ProjectFile[];
  openTabs: FileTab[];
  activeFileId: string | null;
  validationError: string | null;
  socket: any | null;
  setSocket: (socket: any | null) => void;
  setValidationError: (err: string | null) => void;
  setFiles: (files: ProjectFile[]) => void;
  fetchFileTree: (roomId: string) => Promise<void>;
  createNode: (
    roomId: string,
    data: { name: string; type: 'file' | 'directory'; parentId?: string; content?: string }
  ) => Promise<ProjectFile>;
  renameNode: (roomId: string, fileId: string, newName: string) => Promise<void>;
  openFile: (file: ProjectFile) => void;
  closeTab: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  updateFileContent: (fileId: string, content: string) => void;
  deleteNode: (roomId: string, fileId: string) => Promise<void>;
  moveNode: (roomId: string, fileId: string, targetParentId: string | null) => Promise<void>;
  createPathNodes: (roomId: string, rawPath: string, parentId?: string | null) => Promise<ProjectFile | null>;
  addNodeFromSocket: (node: ProjectFile) => void;
  renameNodeFromSocket: (fileId: string, newName: string) => void;
  moveNodeFromSocket: (fileId: string, targetParentId: string | null) => void;
  deleteNodeFromSocket: (fileId: string) => void;
  clearFileStore: () => void;
}

function getMonacoLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
      return 'javascript';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    default:
      return 'plaintext';
  }
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  openTabs: [],
  activeFileId: null,
  validationError: null,
  socket: null,

  setSocket: (socket) => set({ socket }),
  setValidationError: (err) => set({ validationError: err }),
  setFiles: (files) => set({ files }),

  fetchFileTree: async (roomId) => {
    try {
      const files = await fileService.getFileTree(roomId);
      set({ files });
      
      // Auto-open the first file if none is active
      if (files.length > 0 && !get().activeFileId) {
        const firstFile = files.find((f) => f.type === 'file');
        if (firstFile) {
          get().openFile(firstFile);
        }
      }
    } catch (err) {
      console.error('Failed to fetch file tree:', err);
    }
  },

  createNode: async (roomId, data) => {
    const node = await fileService.createNode(roomId, data);
    set((state) => ({
      files: [...state.files, node],
    }));

    // Broadcast file creation via socket if connected
    const socket = get().socket;
    if (socket) {
      socket.emit('filetree:mutate', { type: 'create', node });
    }
    return node;
  },

  renameNode: async (roomId, fileId, newName) => {
    await fileService.renameNode(roomId, fileId, newName);
    set((state) => {
      const updatedFiles = state.files.map((f) => (f.id === fileId ? { ...f, name: newName } : f));
      const updatedTabs = state.openTabs.map((t) =>
        t.id === fileId ? { ...t, name: newName, language: getMonacoLanguage(newName) } : t
      );

      // Broadcast file rename via socket if connected
      const socket = state.socket;
      if (socket) {
        socket.emit('filetree:mutate', { type: 'rename', fileId, newName });
      }

      return {
        files: updatedFiles,
        openTabs: updatedTabs,
      };
    });
  },

  openFile: (file) => {
    const { openTabs } = get();
    const tabExists = openTabs.some((t) => t.id === file.id);

    if (!tabExists) {
      const newTab: FileTab = {
        id: file.id,
        name: file.name,
        language: getMonacoLanguage(file.name),
      };
      set({
        openTabs: [...openTabs, newTab],
        activeFileId: file.id,
      });
    } else {
      set({
        activeFileId: file.id,
      });
    }
  },

  closeTab: (fileId) => {
    const { openTabs, activeFileId } = get();
    const filteredTabs = openTabs.filter((t) => t.id !== fileId);

    let nextActiveId = activeFileId;
    if (activeFileId === fileId) {
      if (filteredTabs.length > 0) {
        nextActiveId = filteredTabs[filteredTabs.length - 1].id;
      } else {
        nextActiveId = null;
      }
    }

    set({
      openTabs: filteredTabs,
      activeFileId: nextActiveId,
    });
  },

  setActiveFile: (fileId) => set({ activeFileId: fileId }),

  reorderTabs: (fromIndex, toIndex) => {
    const { openTabs } = get();
    const result = Array.from(openTabs);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    set({ openTabs: result });
  },

  updateFileContent: (fileId, content) => {
    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? { ...f, content } : f)),
    }));
  },

  deleteNode: async (roomId, fileId) => {
    await fileService.deleteNode(roomId, fileId);

    const getDescendantIds = (parentId: string, filesList: ProjectFile[]): string[] => {
      const children = filesList.filter((f) => f.parentId === parentId);
      const childIds = children.map((c) => c.id);
      const grandchildIds = children.flatMap((c) => getDescendantIds(c.id, filesList));
      return [...childIds, ...grandchildIds];
    };

    set((state) => {
      const deletedIds = [fileId, ...getDescendantIds(fileId, state.files)];
      const updatedFiles = state.files.filter((f) => !deletedIds.includes(f.id));
      const updatedTabs = state.openTabs.filter((t) => !deletedIds.includes(t.id));

      let nextActiveId = state.activeFileId;
      if (state.activeFileId && deletedIds.includes(state.activeFileId)) {
        if (updatedTabs.length > 0) {
          nextActiveId = updatedTabs[updatedTabs.length - 1].id;
        } else {
          nextActiveId = null;
        }
      }

      // Broadcast file deletion via socket if connected
      const socket = state.socket;
      if (socket) {
        socket.emit('filetree:mutate', { type: 'delete', fileId });
      }

      return {
        files: updatedFiles,
        openTabs: updatedTabs,
        activeFileId: nextActiveId,
      };
    });
  },

  moveNode: async (roomId, fileId, targetParentId) => {
    const { files } = get();
    if (targetParentId === fileId) return;

    if (targetParentId !== null) {
      const nodeMap = new Map(files.map((f) => [f.id, f]));
      let current: string | null = targetParentId;
      while (current !== null) {
        if (current === fileId) return; // Prevent moving into own subdirectory
        const currNode = nodeMap.get(current);
        current = currNode ? currNode.parentId : null;
      }
    }

    await fileService.moveNode(roomId, fileId, targetParentId);
    set((state) => {
      const updatedFiles = state.files.map((f) =>
        f.id === fileId ? { ...f, parentId: targetParentId } : f
      );
      const socket = state.socket;
      if (socket) {
        socket.emit('filetree:mutate', { type: 'move', fileId, targetParentId });
      }
      return { files: updatedFiles };
    });
  },

  createPathNodes: async (roomId, rawPath, initialParentId = null) => {
    const isDir = rawPath.endsWith('/');
    const parts = rawPath.split('/').filter(Boolean);
    if (parts.length === 0) return null;

    let currentParentId: string | null = initialParentId || null;
    let lastCreatedFile: ProjectFile | null = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;
      const nodeType = (!isLastPart || isDir) ? 'directory' : 'file';

      const currentFiles = get().files;
      const existing = currentFiles.find(
        (f) => f.name === part && f.parentId === currentParentId
      );

      if (existing) {
        currentParentId = existing.id;
        if (existing.type === 'file') {
          lastCreatedFile = existing;
        }
      } else {
        const created = await get().createNode(roomId, {
          name: part,
          type: nodeType,
          parentId: currentParentId || undefined,
          content: '',
        });
        currentParentId = created.id;

        if (nodeType === 'file') {
          lastCreatedFile = created;
        }
      }
    }

    if (lastCreatedFile) {
      get().openFile(lastCreatedFile);
    }
    return lastCreatedFile;
  },

  addNodeFromSocket: (node) => {
    set((state) => {
      // Prevent duplicates
      if (state.files.some((f) => f.id === node.id)) return {};
      return {
        files: [...state.files, node],
      };
    });
  },

  renameNodeFromSocket: (fileId, newName) => {
    set((state) => {
      const updatedFiles = state.files.map((f) => (f.id === fileId ? { ...f, name: newName } : f));
      const updatedTabs = state.openTabs.map((t) =>
        t.id === fileId ? { ...t, name: newName, language: getMonacoLanguage(newName) } : t
      );
      return {
        files: updatedFiles,
        openTabs: updatedTabs,
      };
    });
  },

  moveNodeFromSocket: (fileId, targetParentId) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === fileId ? { ...f, parentId: targetParentId } : f
      ),
    }));
  },

  deleteNodeFromSocket: (fileId) => {
    set((state) => {
      const getDescendantIds = (parentId: string, filesList: ProjectFile[]): string[] => {
        const children = filesList.filter((f) => f.parentId === parentId);
        const childIds = children.map((c) => c.id);
        const grandchildIds = children.flatMap((c) => getDescendantIds(c.id, filesList));
        return [...childIds, ...grandchildIds];
      };

      const deletedIds = [fileId, ...getDescendantIds(fileId, state.files)];
      const updatedFiles = state.files.filter((f) => !deletedIds.includes(f.id));
      const updatedTabs = state.openTabs.filter((t) => !deletedIds.includes(t.id));

      let nextActiveId = state.activeFileId;
      if (state.activeFileId && deletedIds.includes(state.activeFileId)) {
        if (updatedTabs.length > 0) {
          nextActiveId = updatedTabs[updatedTabs.length - 1].id;
        } else {
          nextActiveId = null;
        }
      }

      return {
        files: updatedFiles,
        openTabs: updatedTabs,
        activeFileId: nextActiveId,
      };
    });
  },

  clearFileStore: () =>
    set({
      files: [],
      openTabs: [],
      activeFileId: null,
      socket: null,
    }),
}));
