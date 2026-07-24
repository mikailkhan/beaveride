import React, { useState } from 'react';
import { useFileStore } from '../../store/fileStore';
import { getFileIcon } from '../../utils/fileUtils';

export const EditorTabs: React.FC = () => {
  const { openTabs, activeFileId, setActiveFile, closeTab, reorderTabs } = useFileStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      reorderTabs(fromIndex, toIndex);
    }
    setDraggedIndex(null);
  };

  if (openTabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center w-full overflow-x-auto bg-surface-container/60 border-b border-outline-variant/20 scrollbar-thin h-9 shrink-0">
      {openTabs.map((tab, index) => {
        const isActive = tab.id === activeFileId;
        const isDragging = index === draggedIndex;

        return (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => setActiveFile(tab.id)}
            className={`group flex items-center gap-xs px-sm py-1.5 h-full border-r border-outline-variant/20 text-xs cursor-pointer select-none transition-all duration-150 shrink-0 ${
              isActive
                ? 'bg-surface-bright text-primary font-medium border-b-2 border-b-primary'
                : 'text-on-surface-variant/70 hover:bg-surface-container-high/40 hover:text-on-surface'
            } ${isDragging ? 'opacity-40' : 'opacity-100'}`}
          >
            {getFileIcon(tab.name)}
            <span className="truncate max-w-[120px] text-[13px]">{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded hover:bg-surface-container-highest p-[2px] inline-flex items-center justify-center transition-all duration-150"
            >
              <span className="material-symbols-outlined text-[13px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
