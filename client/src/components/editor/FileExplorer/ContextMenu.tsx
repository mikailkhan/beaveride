import React, { useEffect, useRef } from 'react';

interface ContextMenuItem {
  label: string;
  icon: string;
  shortcut?: string;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates if menu would overflow screen
  const resolvedX = Math.min(x, window.innerWidth - 200);
  const resolvedY = Math.min(y, window.innerHeight - 150);

  return (
    <div
      ref={menuRef}
      style={{ top: `${resolvedY}px`, left: `${resolvedX}px` }}
      className="fixed z-50 min-w-[180px] bg-white/95 backdrop-blur-md border border-outline-variant/30 rounded-lg shadow-lg py-1 select-none pointer-events-auto"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
          className="w-full flex items-center justify-between py-1.5 px-sm hover:bg-surface-container-high/60 text-left text-xs text-on-surface font-label-md transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </div>
          {item.shortcut && (
            <span className="text-[11px] text-on-surface-variant/60 font-mono ml-3 shrink-0">
              {item.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
