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
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Shared Projects</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
            Hello, {displayName}. Here are the collaborative workspaces shared with you.
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
          <div className="text-center py-20 text-on-surface-variant font-body-md">Loading shared projects...</div>
        ) : sharedRooms.length === 0 ? (
          <div className="glass-panel p-2xl rounded-xl shadow-sm border border-dashed border-outline-variant flex flex-col items-center justify-center text-center gap-sm min-h-[220px]">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl">groups</span>
            </div>
            <div>
              <h3 className="font-label-md text-label-md font-bold text-on-surface mt-sm">No shared projects</h3>
              <p className="font-body-md text-sm text-on-surface-variant mt-xs">Use the Join Project button to connect to a workspace room.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {sharedRooms.map((room) => (
              <Link
                key={room.id}
                to={`/room/${room.id}`}
                className="glass-panel p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group border border-surface-variant flex flex-col justify-between min-h-[180px] bg-surface-container-lowest block"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                
                {/* Card Top */}
                <div>
                  <div className="flex justify-between items-start mb-md">
                    <div className="flex items-center gap-sm min-w-0">
                      <div className="w-8 h-8 rounded bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-sm">terminal</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-label-md text-label-md font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {room.title}
                        </h3>
                        <p className="font-code-md text-xs text-on-surface-variant mt-xs">
                          {formatLanguageName(room.language)}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] px-sm py-[2px] bg-secondary-container text-on-secondary-container rounded font-semibold shrink-0 uppercase tracking-wider">
                      {room.role}
                    </span>
                  </div>
                </div>

                {/* Card Bottom */}
                <div className="flex justify-between items-end mt-lg border-t border-surface-variant/30 pt-sm">
                  <span className="flex items-center gap-xs font-label-md text-[11px] text-secondary px-sm py-[2px] bg-secondary-container rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    Active
                  </span>
                  <span className="font-label-md text-xs text-on-surface-variant">
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
