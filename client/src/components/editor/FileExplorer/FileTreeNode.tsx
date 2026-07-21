import React, { useState, useEffect, useRef } from 'react';
import type { ProjectFile } from '../../../types';
import { useFileStore } from '../../../store/fileStore';
import { ContextMenu } from './ContextMenu';

interface FileTreeNodeProps {
  node: ProjectFile;
  childrenMap: Map<string | null, ProjectFile[]>;
  depth: number;
  roomId: string;
  creatingNode: { parentId: string | null; type: 'file' | 'directory' } | null;
  setCreatingNode: (val: { parentId: string | null; type: 'file' | 'directory' } | null) => void;
  renamingNodeId: string | null;
  setRenamingNodeId: (val: string | null) => void;
}

const InlineInput: React.FC<{
  type: 'file' | 'directory';
  depth: number;
  initialValue?: string;
  onSave: (val: string) => void;
  onCancel: () => void;
}> = ({ type, depth, initialValue = '', onSave, onCancel }) => {
  const [value, setValue] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Guard against double-submission (Enter fires keydown, which can also trigger blur)
  const submittedRef = useRef(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (initialValue) {
        const dotIdx = initialValue.lastIndexOf('.');
        if (dotIdx > 0 && type === 'file') {
          inputRef.current.setSelectionRange(0, dotIdx);
        } else {
          inputRef.current.select();
        }
      }
    }
  }, [initialValue, type]);

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
    <div
      className="flex items-center gap-xs py-[2px] px-sm w-full"
      style={{ paddingLeft: `${(depth + 1) * 12}px` }}
    >
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

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  childrenMap,
  depth,
  roomId,
  creatingNode,
  setCreatingNode,
  renamingNodeId,
  setRenamingNodeId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const activeFileId = useFileStore((state) => state.activeFileId);
  const openFile = useFileStore((state) => state.openFile);
  const renameNode = useFileStore((state) => state.renameNode);
  const createNode = useFileStore((state) => state.createNode);
  const deleteNode = useFileStore((state) => state.deleteNode);

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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRename = async (newName: string) => {
    try {
      await renameNode(roomId, node.id, newName);
    } catch (err) {
      console.error(err);
    } finally {
      setRenamingNodeId(null);
    }
  };

  const handleCreateChild = async (name: string) => {
    if (!creatingNode) return;
    const type = creatingNode.type;
    try {
      const created = await createNode(roomId, {
        name,
        type,
        parentId: node.id,
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

  // Expand folder automatically when a child is being created inside it
  useEffect(() => {
    if (creatingNode && creatingNode.parentId === node.id) {
      setIsExpanded(true);
    }
  }, [creatingNode, node.id]);

  const handleDelete = async () => {
    const isFolder = node.type === 'directory';
    const msg = isFolder
      ? `Are you sure you want to delete "${node.name}" and all of its contents?`
      : `Are you sure you want to delete "${node.name}"?`;

    if (window.confirm(msg)) {
      try {
        await deleteNode(roomId, node.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const menuItems = isDirectory
    ? [
        {
          label: 'New File',
          icon: 'note_add',
          onClick: () => setCreatingNode({ parentId: node.id, type: 'file' }),
        },
        {
          label: 'New Folder',
          icon: 'create_new_folder',
          onClick: () => setCreatingNode({ parentId: node.id, type: 'directory' }),
        },
        {
          label: 'Rename',
          icon: 'edit',
          onClick: () => setRenamingNodeId(node.id),
        },
        {
          label: 'Delete',
          icon: 'delete',
          onClick: handleDelete,
        },
      ]
    : [
        {
          label: 'Rename',
          icon: 'edit',
          onClick: () => setRenamingNodeId(node.id),
        },
        {
          label: 'Delete',
          icon: 'delete',
          onClick: handleDelete,
        },
      ];

  if (renamingNodeId === node.id) {
    return (
      <InlineInput
        type={node.type}
        depth={depth}
        initialValue={node.name}
        onSave={handleRename}
        onCancel={() => setRenamingNodeId(null)}
      />
    );
  }

  return (
    <div className="w-full select-none relative">
      <button
        onClick={handleRowClick}
        onContextMenu={handleContextMenu}
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

      {/* Render child creation input if active for this directory */}
      {isDirectory && isExpanded && creatingNode && creatingNode.parentId === node.id && (
        <InlineInput
          type={creatingNode.type}
          depth={depth + 1}
          onSave={handleCreateChild}
          onCancel={() => setCreatingNode(null)}
        />
      )}

      {/* Render children recursively if expanded */}
      {isDirectory && isExpanded && children.length > 0 && (
        <div className="flex flex-col mt-[1px]">
          {children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              childrenMap={childrenMap}
              depth={depth + 1}
              roomId={roomId}
              creatingNode={creatingNode}
              setCreatingNode={setCreatingNode}
              renamingNodeId={renamingNodeId}
              setRenamingNodeId={setRenamingNodeId}
            />
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={menuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
