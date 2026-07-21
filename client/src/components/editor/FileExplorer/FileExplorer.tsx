import React, { useEffect, useState } from 'react';
import { useFileStore } from '../../../store/fileStore';
import { FileTreeNode } from './FileTreeNode';
import { ContextMenu } from './ContextMenu';
import type { ProjectFile } from '../../../types';

interface FileExplorerProps {
  roomId: string;
}

const InlineInput: React.FC<{
  type: 'file' | 'directory';
  onSave: (val: string) => void;
  onCancel: () => void;
}> = ({ type, onSave, onCancel }) => {
  const [value, setValue] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Guard against double-submission (Enter fires keydown, which can also trigger blur)
  const submittedRef = React.useRef(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (submittedRef.current) return;
    const clean = value.trim();
    if (!clean || /[\/]/.test(clean)) {
      setIsInvalid(true);
      return;
    }
    submittedRef.current = true;
    onSave(clean);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      submittedRef.current = true; // prevent blur from re-triggering
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-xs py-[2px] px-sm w-full pl-3">
      <span className="material-symbols-outlined text-[18px] opacity-80 shrink-0">
        {type === 'directory' ? 'folder' : 'description'}
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setIsInvalid(false);
        }}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        className={`bg-surface border text-[13px] px-[4px] py-[2px] rounded outline-none w-full max-w-[180px] ${
          isInvalid ? 'border-error shadow-[0_0_4px_rgba(186,26,26,0.3)]' : 'border-outline/35 focus:border-primary/50'
        }`}
      />
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ roomId }) => {
  const { files, fetchFileTree, createNode, openFile } = useFileStore();
  const [creatingNode, setCreatingNode] = useState<{ parentId: string | null; type: 'file' | 'directory' } | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

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

  const handleCreateRoot = async (name: string) => {
    if (!creatingNode) return;
    const type = creatingNode.type;
    try {
      const created = await createNode(roomId, {
        name,
        type,
        content: '',
      });
      if (type === 'file') {
        openFile(created);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingNode(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const emptyAreaMenuItems = [
    {
      label: 'New File',
      icon: 'note_add',
      onClick: () => setCreatingNode({ parentId: null, type: 'file' }),
    },
    {
      label: 'New Folder',
      icon: 'create_new_folder',
      onClick: () => setCreatingNode({ parentId: null, type: 'directory' }),
    },
  ];

  return (
    <div
      onContextMenu={handleContextMenu}
      className="w-full flex flex-col h-full overflow-hidden select-none"
    >
      {/* Explorer Toolbar Header */}
      <div className="flex items-center justify-between px-md py-xs border-b border-outline-variant/10 bg-surface-container/20 shrink-0">
        <span className="text-[11px] font-bold tracking-wider text-on-surface-variant/60 uppercase">Files</span>
        <div className="flex items-center gap-xs">
          <button
            onClick={() => setCreatingNode({ parentId: null, type: 'file' })}
            className="p-[3px] rounded hover:bg-surface-container-high text-on-surface-variant/80 hover:text-on-surface transition-colors cursor-pointer"
            title="New File..."
          >
            <span className="material-symbols-outlined text-[16px]">note_add</span>
          </button>
          <button
            onClick={() => setCreatingNode({ parentId: null, type: 'directory' })}
            className="p-[3px] rounded hover:bg-surface-container-high text-on-surface-variant/80 hover:text-on-surface transition-colors cursor-pointer"
            title="New Folder..."
          >
            <span className="material-symbols-outlined text-[16px]">create_new_folder</span>
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto min-h-0 py-xs">
        {creatingNode && creatingNode.parentId === null && (
          <InlineInput
            type={creatingNode.type}
            onSave={handleCreateRoot}
            onCancel={() => setCreatingNode(null)}
          />
        )}

        {rootNodes.length === 0 && !creatingNode ? (
          <div className="text-xs text-on-surface-variant/60 italic p-md text-center">
            No files in this project
          </div>
        ) : (
          <div className="flex flex-col">
            {rootNodes.map((node) => (
              <FileTreeNode
                key={node.id}
                node={node}
                childrenMap={childrenMap}
                depth={0}
                roomId={roomId}
                creatingNode={creatingNode}
                setCreatingNode={setCreatingNode}
                renamingNodeId={renamingNodeId}
                setRenamingNodeId={setRenamingNodeId}
              />
            ))}
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={emptyAreaMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
