import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';

export const SharedProjects = () => {
  const { sharedRooms, isLoading, error, fetchSharedRooms } = useRoomStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSharedRooms();
  }, [fetchSharedRooms]);

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
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Shared Projects</h1>
          <p className="text-[14px] text-[#86868b] mt-1.5">
            Hello, {displayName}. Here are the collaborative workspaces shared with you.
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
          <div className="text-center py-20 text-[#86868b] text-sm font-medium animate-pulse">Loading shared projects...</div>
        ) : sharedRooms.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#e8e8ed] flex flex-col items-center justify-center text-center gap-4 min-h-[220px]">
            <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">groups</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f]">No shared projects</h3>
              <p className="text-xs text-[#86868b] mt-1">Use the Join Project button to connect to a shared room.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharedRooms.map((room) => (
              <Link
                key={room.id}
                to={`/room/${room.id}`}
                className="bg-white p-6 rounded-2xl border border-[#e8e8ed] flex flex-col justify-between min-h-[170px] relative overflow-hidden group hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(165,60,0,0.04)] transition-all duration-300 block"
              >
                {/* Card Top */}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors duration-300 shrink-0">
                        <span className="material-symbols-outlined text-sm">terminal</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#1d1d1f] group-hover:text-primary transition-colors truncate">
                          {room.title}
                        </h3>
                        <p className="text-[11px] font-mono text-[#86868b] mt-0.5 uppercase tracking-wider flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${getLanguageColor(room.language)} bg-current`}></span>
                          {formatLanguageName(room.language)}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded-full shrink-0 uppercase tracking-wider">
                      {room.role}
                    </span>
                  </div>
                </div>

                {/* Card Bottom */}
                <div className="flex justify-between items-end mt-4 border-t border-[#f5f5f7] pt-3.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-secondary bg-secondary-container px-2.5 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    Active
                  </span>
                  <span className="text-[11px] text-[#86868b]">
                    Updated {getRelativeTimeString(room.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
