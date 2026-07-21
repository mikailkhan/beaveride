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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

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
    `flex items-center gap-md rounded-lg font-label-md text-label-md transition-all active:translate-x-1 ${
      isSidebarExpanded ? 'px-md py-sm w-full' : 'p-sm justify-center w-10 h-10 mx-auto'
    } ${
      isActive
        ? 'bg-primary-container text-on-primary-container font-semibold'
        : 'text-on-surface-variant hover:bg-primary-container/10 hover:text-primary'
    }`;

  return (
    <div className="text-on-surface antialiased flex h-screen overflow-hidden w-full bg-surface">
      {/* SideNavBar */}
      <nav className={`fixed left-0 top-0 h-full flex flex-col bg-white z-40 hidden md:flex border-r border-[#e8e8ed] transition-all duration-300 ${isSidebarExpanded ? 'w-72 p-md' : 'w-[70px] py-md px-xs items-center'}`}>
        <div className={`mb-xl flex items-center mt-sm w-full ${isSidebarExpanded ? 'justify-between px-sm' : 'justify-center'}`}>
          {isSidebarExpanded && (
            <Link to="/">
              <img alt="BeaverIDE Logo" className="h-16 w-auto" src={BeaverideLogo} />
            </Link>
          )}
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="p-sm rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
            title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isSidebarExpanded ? 'menu_open' : 'menu'}
            </span>
          </button>
        </div>

        <div className={`mb-lg space-y-sm w-full ${isSidebarExpanded ? 'px-sm' : 'px-0'}`}>
          <Link 
            to="/dashboard/settings"
            className={`flex items-center gap-sm bg-white border border-[#e8e8ed] hover:border-primary-container cursor-pointer transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${isSidebarExpanded ? 'p-sm w-full rounded-lg' : 'w-10 h-10 rounded-full justify-center p-0 mx-auto'}`}
            title="Settings"
          >
            {isSidebarExpanded ? (
              <>
                <img
                  alt="User Profile Avatar"
                  className="w-10 h-10 rounded-full border border-[#e8e8ed] object-cover"
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
              </>
            ) : (
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
            )}
          </Link>

          <button
            onClick={handleOpenCreateModal}
            className={`bg-primary-container text-on-primary-container font-label-md text-label-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-xs cursor-pointer ${isSidebarExpanded ? 'w-full py-sm px-md rounded-lg text-xs font-semibold' : 'w-10 h-10 rounded-full p-0 mx-auto'}`}
            title="New Project"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              add
            </span>
            {isSidebarExpanded && <span>New Project</span>}
          </button>

          <button
            onClick={handleOpenJoinModal}
            className={`bg-white text-on-surface border border-outline-variant hover:bg-surface-container transition-all flex items-center justify-center gap-xs cursor-pointer ${isSidebarExpanded ? 'w-full py-sm px-md rounded-lg text-xs font-semibold' : 'w-10 h-10 rounded-full p-0 mx-auto'}`}
            title="Join Project"
          >
            <span className="material-symbols-outlined text-sm">group_add</span>
            {isSidebarExpanded && <span>Join Project</span>}
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto space-y-1 w-full ${isSidebarExpanded ? 'px-sm' : 'px-0'}`}>
          <NavLink end to="/dashboard" className={linkClass} title="Projects">
            <span className="material-symbols-outlined">folder_open</span>
            {isSidebarExpanded && <span>Projects</span>}
          </NavLink>
          <NavLink to="/dashboard/shared" className={linkClass} title="Shared">
            <span className="material-symbols-outlined">group</span>
            {isSidebarExpanded && <span>Shared</span>}
          </NavLink>
          <NavLink to="/dashboard/archived" className={linkClass} title="Archived">
            <span className="material-symbols-outlined">archive</span>
            {isSidebarExpanded && <span>Archived</span>}
          </NavLink>
          <NavLink to="/dashboard/settings" className={linkClass} title="Settings">
            <span className="material-symbols-outlined">settings</span>
            {isSidebarExpanded && <span>Settings</span>}
          </NavLink>
        </div>

        <div className="mt-auto px-sm pt-md border-t border-[#e8e8ed] space-y-1 w-full">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className={`flex items-center gap-md text-error hover:bg-error-container/20 transition-all rounded-lg font-label-md text-label-md cursor-pointer text-left ${isSidebarExpanded ? 'w-full px-md py-sm' : 'p-sm justify-center w-10 h-10 mx-auto'}`}
            title="Log Out"
          >
            <span className="material-symbols-outlined">logout</span>
            {isSidebarExpanded && <span>Log Out</span>}
          </button>
        </div>
      </nav>

      {/* Main Content Render */}
      <div className={`flex-1 h-full overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'ml-0 md:ml-72' : 'ml-0 md:ml-[70px]'}`}>
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
