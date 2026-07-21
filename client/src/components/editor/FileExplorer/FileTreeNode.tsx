import React, { useState } from 'react';
import type { ProjectFile } from '../../../types';
import { useFileStore } from '../../../store/fileStore';

interface FileTreeNodeProps {
  node: ProjectFile;
  childrenMap: Map<string | null, ProjectFile[]>;
  depth: number;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, childrenMap, depth }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeFileId = useFileStore((state) => state.activeFileId);
  const openFile = useFileStore((state) => state.openFile);

  const isDirectory = node.type === 'directory';
  const isActive = node.id === activeFileId;
  const children = childrenMap.get(node.id) || [];

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      openFile(node);
    }
  };

  return (
    <div className="w-full select-none">
      {/* Node row */}
      <button
        onClick={handleRowClick}
        className={`w-full flex items-center gap-xs py-1 px-sm rounded hover:bg-surface-container-high/40 text-left text-sm cursor-pointer transition-colors duration-150 ${
          isActive ? 'bg-surface-container-highest/80 text-primary font-medium border-l-2 border-primary rounded-l-none' : 'text-on-surface'
        }`}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        <span className="material-symbols-outlined text-[18px] opacity-80 shrink-0">
          {isDirectory ? (isExpanded ? 'folder_open' : 'folder') : 'description'}
        </span>
        <span className="truncate text-[13px]">{node.name}</span>
      </button>

      {/* Render children recursively if expanded */}
      {isDirectory && isExpanded && children.length > 0 && (
        <div className="flex flex-col mt-[1px]">
          {children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              childrenMap={childrenMap}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
