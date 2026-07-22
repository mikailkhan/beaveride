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
  selectedNodeId: string | null;
  setSelectedNodeId: (val: string | null) => void;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'cjs':
    case 'mjs':
      return <span className="material-symbols-outlined text-[18px] text-[#f0db4f] shrink-0">javascript</span>;
    case 'ts':
    case 'tsx':
    case 'jsx':
      return <span className="material-symbols-outlined text-[18px] text-[#3178c6] shrink-0">code</span>;
    case 'py':
      return <span className="material-symbols-outlined text-[18px] text-[#3572A5] shrink-0">code</span>;
    case 'go':
      return <span className="material-symbols-outlined text-[18px] text-[#00add8] shrink-0">code</span>;
    case 'json':
      return <span className="material-symbols-outlined text-[18px] text-[#cb8764] shrink-0">data_object</span>;
    case 'css':
    case 'scss':
      return <span className="material-symbols-outlined text-[18px] text-[#264de4] shrink-0">css</span>;
    case 'html':
      return <span className="material-symbols-outlined text-[18px] text-[#e34c26] shrink-0">html</span>;
    case 'md':
      return <span className="material-symbols-outlined text-[18px] text-[#083344] shrink-0">markdown</span>;
    default:
      return <span className="material-symbols-outlined text-[18px] text-outline shrink-0">description</span>;
  }
};

const InlineInput: React.FC<{
  type: 'file' | 'directory';
  depth: number;
  initialValue?: string;
  onSave: (val: string) => void;
  onSavePath?: (path: string) => void;
  onCancel: () => void;
}> = ({ type, depth, initialValue = '', onSave, onSavePath, onCancel }) => {
  const [value, setValue] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setValidationError = useFileStore((state) => state.setValidationError);
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
    setValidationError(null);
    return () => {
      setValidationError(null);
    };
  }, [initialValue, type, setValidationError]);

  const handleSubmit = () => {
    if (submittedRef.current) return;
    const clean = value.trim();
    if (!clean) {
      setIsInvalid(true);
      setValidationError("Name cannot be empty");
      return;
    }

    submittedRef.current = true;
    setValidationError(null);

    if (onSavePath && clean.includes('/')) {
      onSavePath(clean);
    } else {
      onSave(clean);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      submittedRef.current = true;
      setValidationError(null);
      onCancel();
    }
  };

  const shakeStyle = `
    @keyframes shake-input {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }
    .shake-input {
      animation: shake-input 0.25s ease-in-out;
    }
  `;

  return (
    <div className="flex flex-col w-full">
      <style>{shakeStyle}</style>
      <div
        className="flex items-center gap-xs py-[2px] px-sm w-full"
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        <span className="material-symbols-outlined text-[18px] opacity-80 shrink-0">
          {type === 'directory' || value.endsWith('/') ? 'folder' : 'description'}
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setIsInvalid(false);
            setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setValidationError(null);
            onCancel();
          }}
          className={`bg-surface border text-[13px] px-[4px] py-[2px] rounded outline-none w-full max-w-[180px] ${
            isInvalid ? 'border-error shadow-[0_0_4px_rgba(186,26,26,0.3)] shake-input' : 'border-outline/35 focus:border-primary/50'
          }`}
        />
      </div>
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
  selectedNodeId,
  setSelectedNodeId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const activeFileId = useFileStore((state) => state.activeFileId);
  const openFile = useFileStore((state) => state.openFile);
  const renameNode = useFileStore((state) => state.renameNode);
  const createNode = useFileStore((state) => state.createNode);
  const createPathNodes = useFileStore((state) => state.createPathNodes);
  const moveNode = useFileStore((state) => state.moveNode);
  const deleteNode = useFileStore((state) => state.deleteNode);

  const isDirectory = node.type === 'directory';
  const isActive = node.id === activeFileId;
  const isSelected = node.id === selectedNodeId;
  const children = childrenMap.get(node.id) || [];

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      openFile(node);
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && renamingNodeId !== node.id) {
      e.preventDefault();
      e.stopPropagation();
      setRenamingNodeId(node.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedNodeId(node.id);
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

  const handleCreateChildPath = async (rawPath: string) => {
    try {
      await createPathNodes(roomId, rawPath, node.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingNode(null);
    }
  };

  // Drag & Drop event handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/beaveride-node', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDirectory) {
      setIsDragOver(true);
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const sourceId = e.dataTransfer.getData('text/beaveride-node');
    if (!sourceId || sourceId === node.id) return;

    const targetParentId = isDirectory ? node.id : node.parentId;
    try {
      await moveNode(roomId, sourceId, targetParentId);
    } catch (err) {
      console.error('Failed to move file node:', err);
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
    <div
      draggable={renamingNodeId !== node.id}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full select-none relative transition-colors duration-150 rounded ${
        isDragOver ? 'bg-primary/20 ring-1 ring-primary/40' : ''
      }`}
    >
      <button
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
        onContextMenu={handleContextMenu}
        className={`w-full flex items-center gap-xs py-1 px-sm rounded hover:bg-surface-container-high/40 text-left text-sm cursor-pointer transition-colors duration-150 outline-none focus:ring-1 focus:ring-primary/40 ${
          isActive
            ? 'bg-surface-container-highest/80 text-primary font-medium border-l-2 border-primary rounded-l-none'
            : isSelected
            ? 'bg-surface-container-high/60 text-on-surface'
            : 'text-on-surface'
        }`}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        {isDirectory ? (
          <span className="material-symbols-outlined text-[18px] opacity-80 shrink-0">
            {isExpanded ? 'folder_open' : 'folder'}
          </span>
        ) : (
          getFileIcon(node.name)
        )}
        <span className="truncate text-[13px]">{node.name}</span>
      </button>

      {/* Render child creation input if active for this directory */}
      {isDirectory && isExpanded && creatingNode && creatingNode.parentId === node.id && (
        <InlineInput
          type={creatingNode.type}
          depth={depth + 1}
          onSave={handleCreateChild}
          onSavePath={handleCreateChildPath}
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
              selectedNodeId={selectedNodeId}
              setSelectedNodeId={setSelectedNodeId}
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
