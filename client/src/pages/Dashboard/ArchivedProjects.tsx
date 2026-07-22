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
      case 'javascript': return 'JavaScript';
      case 'python': return 'Python';
      case 'go': return 'Go';
      default: return lang.charAt(0).toUpperCase() + lang.slice(1);
    }
  };

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'javascript': return 'text-[#f0db4f]';
      case 'python': return 'text-[#3572A5]';
      case 'go': return 'text-[#00add8]';
      default: return 'text-[#86868b]';
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
    <main className="flex-1 h-full overflow-y-auto bg-[#f5f5f7] p-8 md:p-12 font-sans text-[#1d1d1f]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-[#e8e8ed] pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Archived Projects</h1>
          <p className="text-[14px] text-[#86868b] mt-1.5">
            Hello, {displayName}. Here are your archived project workspaces.
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg text-xs border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error_outline</span>
          {error}
        </div>
      )}

      <div className="w-full">
        {isLoading ? (
          <div className="text-center py-20 text-[#86868b] text-sm font-medium animate-pulse">Loading archived projects...</div>
        ) : archivedRooms.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#e8e8ed] flex flex-col items-center justify-center text-center gap-4 min-h-[220px]">
            <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b]">
              <span className="material-symbols-outlined text-xl">archive</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f]">No archived projects</h3>
              <p className="text-xs text-[#86868b] mt-1">Archived projects will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white p-6 rounded-2xl border border-[#e8e8ed] flex flex-col justify-between min-h-[170px] relative overflow-hidden group hover:border-primary/30 transition-all duration-300"
              >
                {/* Card Top */}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-[#86868b] shrink-0">
                        <span className="material-symbols-outlined text-sm">terminal</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#1d1d1f] truncate">
                          {room.title}
                        </h3>
                        <p className="text-[11px] font-mono text-[#86868b] mt-0.5 uppercase tracking-wider flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${getLanguageColor(room.language)} bg-current`}></span>
                          {formatLanguageName(room.language)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        title="Restore Project"
                        onClick={(e) => handleRestore(room.id, e)}
                        className="p-1.5 rounded-full hover:bg-[#f5f5f7] text-[#86868b] hover:text-primary transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">settings_backup_restore</span>
                      </button>
                      <button
                        title="Delete Permanently"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmDeleteId(room.id);
                        }}
                        className="p-1.5 rounded-full hover:bg-error-container/20 text-error transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Confirmation Overlays */}
                {confirmDeleteId === room.id && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col justify-center items-center p-4 text-center z-10">
                    <p className="text-sm font-semibold text-error">Delete Permanently?</p>
                    <p className="text-xs text-[#86868b] mt-0.5">This action cannot be undone.</p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                        className="px-3 py-1.5 border border-outline-variant/30 hover:bg-[#f5f5f7] rounded-full text-xs font-semibold transition-colors cursor-pointer text-[#1d1d1f]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => handleDelete(room.id, e)}
                        className="px-3 py-1.5 bg-error text-on-error hover:bg-error/95 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Bottom */}
                <div className="flex justify-between items-end mt-4 border-t border-[#f5f5f7] pt-3.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#86868b] bg-[#f5f5f7] px-2.5 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#86868b]"></span>
                    Archived
                  </span>
                  <span className="text-[11px] text-[#86868b]">
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
