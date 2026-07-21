import { create } from 'zustand';
import type { ProjectFile, FileTab } from '../types';
import { fileService } from '../services/fileService.js';

interface FileState {
  files: ProjectFile[];
  openTabs: FileTab[];
  activeFileId: string | null;
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

  setFiles: (files) => set({ files }),

  fetchFileTree: async (roomId) => {
    try {
      const files = await fileService.getFileTree(roomId);
      set({ files });
    } catch (err) {
      console.error('Failed to fetch file tree:', err);
    }
  },

  createNode: async (roomId, data) => {
    const node = await fileService.createNode(roomId, data);
    set((state) => ({
      files: [...state.files, node],
    }));
    return node;
  },

  renameNode: async (roomId, fileId, newName) => {
    await fileService.renameNode(roomId, fileId, newName);
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

  clearFileStore: () =>
    set({
      files: [],
      openTabs: [],
      activeFileId: null,
    }),
}));
