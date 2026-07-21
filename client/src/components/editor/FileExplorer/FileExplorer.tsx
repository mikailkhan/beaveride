import React, { useEffect } from 'react';
import { useFileStore } from '../../../store/fileStore';
import { FileTreeNode } from './FileTreeNode';
import type { ProjectFile } from '../../../types';

interface FileExplorerProps {
  roomId: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ roomId }) => {
  const { files, fetchFileTree } = useFileStore();

  useEffect(() => {
    if (roomId) {
      fetchFileTree(roomId);
    }
  }, [roomId, fetchFileTree]);

  // Build the parent -> children map
  const childrenMap = new Map<string | null, ProjectFile[]>();
  
  files.forEach((f) => {
    const parentId = f.parentId;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(f);
  });

  // Helper function to sort nodes: directories first, then files, alphabetically
  const sortNodes = (nodes: ProjectFile[]) => {
    return [...nodes].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  // Sort each group in childrenMap
  childrenMap.forEach((nodes, key) => {
    childrenMap.set(key, sortNodes(nodes));
  });

  const rootNodes = childrenMap.get(null) || [];

  return (
    <div className="w-full flex flex-col h-full overflow-y-auto">
      {rootNodes.length === 0 ? (
        <div className="text-xs text-on-surface-variant/60 italic p-md text-center">
          No files in this project
        </div>
      ) : (
        <div className="flex flex-col py-xs">
          {rootNodes.map((node) => (
            <FileTreeNode
              key={node.id}
              node={node}
              childrenMap={childrenMap}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
};
