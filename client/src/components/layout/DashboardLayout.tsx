import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import { useState } from 'react';
import BeaverideLogo from '../../assets/logos/beaveride-logo.png';

export const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const { createRoom, joinRoom } = useRoomStore();
  const navigate = useNavigate();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // Form states
  const [createTitle, setCreateTitle] = useState('');
  const [createLang, setCreateLang] = useState('javascript');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreateModal = () => {
    setCreateTitle('');
    setCreateLang('javascript');
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleOpenJoinModal = () => {
    setJoinRoomId('');
    setFormError('');
    setIsJoinOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setFormError('Room title is required');
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      const newRoom = await createRoom(createTitle.trim(), createLang);
      setIsCreateOpen(false);
      navigate(`/room/${newRoom.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) {
      setFormError('Room ID is required');
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      await joinRoom(joinRoomId.trim());
      setIsJoinOpen(false);
      navigate(`/room/${joinRoomId.trim()}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = user ? `${user.firstName}` : 'Developer';
  const displayEmail = user ? user.email : 'pro@beaveride.com';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-md px-md py-sm rounded-lg font-label-md text-label-md transition-all active:translate-x-1 ${
      isActive
        ? 'bg-primary-container text-on-primary-container font-semibold'
        : 'text-on-surface-variant hover:bg-surface-container-highest'
    }`;

  return (
    <div className="text-on-surface antialiased flex h-screen overflow-hidden w-full bg-surface">
      {/* SideNavBar */}
      <nav className="fixed left-0 top-0 h-full flex flex-col p-md bg-surface-container-low w-72 z-40 hidden md:flex border-r border-surface-variant">
        <div className="mb-xl flex items-center gap-sm px-sm mt-sm">
          <Link to="/">
            <img alt="BeaverIDE Logo" className="h-16 w-auto" src={BeaverideLogo} />
          </Link>
        </div>

        <div className="mb-lg px-sm space-y-sm">
          <Link 
            to="/dashboard/settings"
            className="flex items-center gap-sm p-sm bg-surface rounded-lg border border-surface-variant cursor-pointer hover:bg-surface-container transition-colors"
          >
            <img
              alt="User Profile Avatar"
              className="w-10 h-10 rounded-full border-2 border-primary-container object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNkOZEkCu2AprexCFCsvJXOpZLv53DVKcel7waC9Azezg6wawU3xFOhERlB6zleyXPLMJJR9zqziiq1D502_BUqjXml_hH52FOtSbzftwTpNVo44wUKjf3qi5bij0DfFh7DZrQU3jWGXMYj26_EJNk0_-j3ka1f6oryihMIel8vCSNHAWYsbcdRo2VEgIGFHZeDmweouDuqv23igV0LwXnCX0bcE3Nd7M0A_ObOOQdP1PhZVeUYXk_rEFynUiSHMDdISvi-TvvGds"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                {displayName} Workspace
              </span>
              <span className="font-code-md text-xs text-on-surface-variant truncate">
                {displayEmail}
              </span>
            </div>
          </Link>

          <button
            onClick={handleOpenCreateModal}
            className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-sm px-md rounded-lg flex items-center justify-center gap-xs hover:bg-primary hover:text-on-primary transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              add
            </span>
            New Project
          </button>

          <button
            onClick={handleOpenJoinModal}
            className="w-full bg-surface text-on-surface border border-surface-variant font-label-md text-label-md py-sm px-md rounded-lg flex items-center justify-center gap-xs hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">group_add</span>
            Join Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 px-sm">
          <NavLink end to="/dashboard" className={linkClass}>
            <span className="material-symbols-outlined">folder_open</span>
            Projects
          </NavLink>
          <NavLink to="/dashboard/shared" className={linkClass}>
            <span className="material-symbols-outlined">group</span>
            Shared
          </NavLink>
          <NavLink to="/dashboard/archived" className={linkClass}>
            <span className="material-symbols-outlined">archive</span>
            Archived
          </NavLink>
          <NavLink to="/dashboard/settings" className={linkClass}>
            <span className="material-symbols-outlined">settings</span>
            Settings
          </NavLink>
        </div>

        <div className="mt-auto px-sm pt-md border-t border-surface-variant space-y-1">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-md px-md py-sm text-error hover:bg-error-container/20 transition-all rounded-lg font-label-md text-label-md cursor-pointer text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Content Render */}
      <div className="flex-1 ml-0 md:ml-72 h-full overflow-hidden">
        <Outlet />
      </div>

      {/* CREATE ROOM MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-md">
          <div className="bg-surface rounded-xl shadow-xl border border-surface-variant max-w-3xl w-full p-lg flex flex-col gap-md">
            <div>
              <h3 className="font-headline-md text-lg text-on-surface font-semibold">Create New Project</h3>
              <p className="font-body-md text-sm text-on-surface-variant mt-xs">Setup a new collaborative code editor room.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-md">
              {formError && (
                <div className="p-sm bg-error-container text-on-error-container rounded-lg font-body-md text-xs border border-error/20">
                  {formError}
                </div>
              )}

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-xs text-on-surface font-semibold">Project Title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. My Awesome API"
                  disabled={isSubmitting}
                  className="w-full bg-surface-container-lowest border border-surface-variant rounded-lg p-sm font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-xs text-on-surface font-semibold">Programming Language</label>
                <select
                  value={createLang}
                  onChange={(e) => setCreateLang(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-surface-container-lowest border border-surface-variant rounded-lg p-sm font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                >
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="python">Python 3</option>
                  <option value="go">Go (Golang)</option>
                </select>
              </div>

              <div className="flex justify-end gap-sm mt-md">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                  className="px-md py-sm bg-surface border border-surface-variant rounded-lg font-label-md text-sm hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-md py-sm bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary rounded-lg font-label-md text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN ROOM MODAL */}
      {isJoinOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-md">
          <div className="bg-surface rounded-xl shadow-xl border border-surface-variant max-w-3xl w-full p-lg flex flex-col gap-md">
            <div>
              <h3 className="font-headline-md text-lg text-on-surface font-semibold">Join Project</h3>
              <p className="font-body-md text-sm text-on-surface-variant mt-xs">Collaborate in an existing coding room.</p>
            </div>

            <form onSubmit={handleJoinSubmit} className="flex flex-col gap-md">
              {formError && (
                <div className="p-sm bg-error-container text-on-error-container rounded-lg font-body-md text-xs border border-error/20">
                  {formError}
                </div>
              )}

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-xs text-on-surface font-semibold">Room ID</label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="e.g. 1"
                  disabled={isSubmitting}
                  className="w-full bg-surface-container-lowest border border-surface-variant rounded-lg p-sm font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="flex justify-end gap-sm mt-md">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  disabled={isSubmitting}
                  className="px-md py-sm bg-surface border border-surface-variant rounded-lg font-label-md text-sm hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-md py-sm bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary rounded-lg font-label-md text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
