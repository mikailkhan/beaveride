import { useEffect, useState } from 'react';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';

export const ArchivedProjects = () => {
  const { archivedRooms, isLoading, error, fetchArchivedRooms, restoreRoom, deleteRoom } = useRoomStore();
  const { user } = useAuthStore();

  // State to track which project card is showing permanent delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchArchivedRooms();
  }, [fetchArchivedRooms]);

  const handleRestore = async (roomId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await restoreRoom(roomId);
    } catch (err) {
      console.error('Failed to restore room:', err);
    }
  };

  const handleDelete = async (roomId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteRoom(roomId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to permanently delete room:', err);
    }
  };

  const formatLanguageName = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'javascript': return 'JavaScript (Node.js)';
      case 'python': return 'Python 3';
      case 'go': return 'Go (Golang)';
      default: return lang.charAt(0).toUpperCase() + lang.slice(1);
    }
  };

  const getRelativeTimeString = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const displayName = user ? `${user.firstName}` : 'Developer';

  return (
    <main className="flex-1 h-full overflow-y-auto bg-surface-container-lowest p-margin md:p-2xl">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-xl gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Archived Projects</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
            Hello, {displayName}. Here are your archived project workspaces.
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg font-body-md text-sm border border-error/20">
          {error}
        </div>
      )}

      <div className="w-full">
        {isLoading ? (
          <div className="text-center py-20 text-on-surface-variant font-body-md">Loading archived projects...</div>
        ) : archivedRooms.length === 0 ? (
          <div className="glass-panel p-2xl rounded-xl shadow-sm border border-dashed border-outline-variant flex flex-col items-center justify-center text-center gap-sm min-h-[220px]">
            <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-2xl">archive</span>
            </div>
            <div>
              <h3 className="font-label-md text-label-md font-bold text-on-surface mt-sm">No archived projects</h3>
              <p className="font-body-md text-sm text-on-surface-variant mt-xs">Archived projects will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {archivedRooms.map((room) => (
              <div
                key={room.id}
                className="glass-panel p-lg rounded-xl shadow-sm relative overflow-hidden group border border-surface-variant flex flex-col justify-between min-h-[180px] bg-surface-container-lowest"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-outline"></div>
                
                {/* Card Top */}
                <div>
                  <div className="flex justify-between items-start mb-md">
                    <div className="flex items-center gap-sm min-w-0">
                      <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center text-on-surface-variant shrink-0">
                        <span className="material-symbols-outlined text-sm">terminal</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-label-md text-label-md font-bold text-on-surface truncate">
                          {room.title}
                        </h3>
                        <p className="font-code-md text-xs text-on-surface-variant mt-xs">
                          {formatLanguageName(room.language)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-xs shrink-0">
                      <button
                        title="Restore Project"
                        onClick={(e) => handleRestore(room.id, e)}
                        className="p-xs rounded-full hover:bg-surface-variant text-primary transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">settings_backup_restore</span>
                      </button>
                      <button
                        title="Delete Permanently"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmDeleteId(room.id);
                        }}
                        className="p-xs rounded-full hover:bg-error-container/20 text-error transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Confirmation Overlays */}
                {confirmDeleteId === room.id && (
                  <div className="absolute inset-0 bg-surface/95 backdrop-blur-xs flex flex-col justify-center items-center p-md text-center z-10">
                    <p className="font-label-md text-error font-bold">Delete Permanently?</p>
                    <p className="font-body-md text-xs text-on-surface-variant mt-xs">This action cannot be undone.</p>
                    <div className="flex gap-sm mt-md">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                        className="px-sm py-xs bg-surface border border-surface-variant rounded-md text-xs font-label-md transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => handleDelete(room.id, e)}
                        className="px-sm py-xs bg-error text-on-error rounded-md text-xs font-label-md transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Bottom */}
                <div className="flex justify-between items-end mt-lg border-t border-surface-variant/30 pt-sm">
                  <span className="flex items-center gap-xs font-label-md text-[11px] text-on-surface-variant px-sm py-[2px] bg-surface-variant rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                    Archived
                  </span>
                  <span className="font-label-md text-xs text-on-surface-variant">
                    Updated {getRelativeTimeString(room.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
