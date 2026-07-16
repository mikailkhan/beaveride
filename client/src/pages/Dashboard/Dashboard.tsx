import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import BeaverideLogo from '../../assets/logos/beaveride-logo.png';

export const Dashboard = () => {
  const { rooms, isLoading, error, fetchRooms, createRoom, joinRoom } = useRoomStore();
  const { user, logout } = useAuthStore();
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

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

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

  const formatLanguageName = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'javascript': return 'JavaScript (Node.js)';
      case 'typescript': return 'TypeScript (Node.js)';
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
  const displayEmail = user ? user.email : 'pro@beaveride.com';

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
          <div className="flex items-center gap-sm p-sm bg-surface rounded-lg border border-surface-variant cursor-pointer hover:bg-surface-container transition-colors">
            <img 
              alt="User Profile Avatar" 
              className="w-10 h-10 rounded-full border-2 border-primary-container object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNkOZEkCu2AprexCFCsvJXOpZLv53DVKcel7waC9Azezg6wawU3xFOhERlB6zleyXPLMJJR9zqziiq1D502_BUqjXml_hH52FOtSbzftwTpNVo44wUKjf3qi5bij0DfFh7DZrQU3jWGXMYj26_EJNk0_-j3ka1f6oryihMIel8vCSNHAWYsbcdRo2VEgIGFHZeDmweouDuqv23igV0LwXnCX0bcE3Nd7M0A_ObOOQdP1PhZVeUYXk_rEFynUiSHMDdISvi-TvvGds" 
            />
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface font-semibold truncate">{displayName} Workspace</span>
              <span className="font-code-md text-xs text-on-surface-variant truncate">{displayEmail}</span>
            </div>
          </div>
          
          <button 
            onClick={handleOpenCreateModal}
            className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-sm px-md rounded-lg flex items-center justify-center gap-xs hover:bg-primary hover:text-on-primary transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
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
          <Link className="flex items-center gap-md px-md py-sm bg-primary-container text-on-primary-container rounded-lg font-label-md text-label-md transition-all active:translate-x-1" to="/dashboard">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
            Projects
          </Link>
          <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-highest transition-all rounded-lg font-label-md text-label-md active:translate-x-1" href="#shared">
            <span className="material-symbols-outlined">group</span>
            Shared
          </a>
          
          <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-highest transition-all rounded-lg font-label-md text-label-md active:translate-x-1" href="#settings">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </a>
          
        </div>

        <div className="mt-auto px-sm pt-md border-t border-surface-variant space-y-1">
          
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-md px-md py-sm text-error hover:bg-error-container/20 transition-all rounded-lg font-label-md text-label-md cursor-pointer text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 ml-0 md:ml-72 h-full overflow-y-auto bg-surface-container-lowest p-margin md:p-2xl">
        {/* Header */}
        <header className="flex justify-between items-end mb-xl">
          <div>
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Good Morning, {displayName}.</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
              You have {rooms.length} active project{rooms.length !== 1 ? 's' : ''}. Workspace usage is healthy.
            </p>
          </div>
          <div className="hidden md:flex gap-sm">
            <button className="p-sm rounded-full bg-surface-container-high hover:bg-surface-variant transition-colors text-on-surface-variant cursor-pointer">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg font-body-md text-sm border border-error/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Recent Projects */}
          <section className="lg:col-span-8 flex flex-col gap-md">
            <div className="flex justify-between items-center mb-sm">
              <h2 className="font-headline-md text-body-lg font-semibold text-on-surface">Recent Projects</h2>
              <a className="font-label-md text-label-md text-tertiary hover:text-on-tertiary-fixed-variant transition-colors" href="#all-projects">View All</a>
            </div>

            {isLoading ? (
              <div className="text-center py-20 text-on-surface-variant font-body-md">Loading projects...</div>
            ) : rooms.length === 0 ? (
              <div 
                onClick={handleOpenCreateModal}
                className="glass-panel p-2xl rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer border border-dashed border-outline-variant flex flex-col items-center justify-center text-center gap-sm min-h-[220px]"
              >
                <div className="w-12 h-12 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-all">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <div>
                  <h3 className="font-label-md text-label-md font-bold text-on-surface mt-sm">No projects found</h3>
                  <p className="font-body-md text-sm text-on-surface-variant mt-xs">Create your first collaborative workspace room.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {rooms.map((room, idx) => (
                  <Link 
                    key={room.id} 
                    to={`/room/${room.id}`}
                    className="glass-panel p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer border border-surface-variant block"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
                    <div className="flex justify-between items-start mb-md">
                      <div className="flex items-center gap-sm min-w-0">
                        <div className="w-8 h-8 rounded bg-primary-fixed flex items-center justify-center text-primary shrink-0">
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
                      
                      <span className="flex items-center gap-xs font-label-md text-xs text-secondary px-sm py-xs bg-secondary-container rounded-full shrink-0">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                        Running
                      </span>
                    </div>

                    <div className="flex justify-between items-end mt-lg">
                      <div className="flex -space-x-2">
                        <img 
                          alt="Collaborator 1" 
                          className="w-6 h-6 rounded-full border-2 border-surface-container-lowest object-cover" 
                          src={idx % 2 === 0 ? 
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuDa3Aq90B0flEiJuFiVaiymchfvvI-zejOTn8kG8qdysXd3oc6iLPHDNCmuFC2kXVBZHCqAwKRMzMbH15lHN8z1IsiDZd_y7l-3h339R6ybJXvo6mDBxoPsD-bTw2EnOlz62R2nj_FH2K9WZoI6ehhcUytlpReEcSbwyX5OT9ovqXO3uxOaxfa2eGN9JodQPYhsRqqF_bpgZJH-5W_-8O-u1b13n9Vqg3G_LaCm0JaSdkTG3by5-odgEcnrB2ZZLEVE5Jsky-f3VXY" : 
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuBB6Ie1n1GxIOUi78mxgpdeMMUrxs_p_rM9hfBteaw_ygWOYdUGYfGGrNyk4ozzEx1z8NO4kkNLkd8kIr18Mf9t4cdn8Lg2JGHBS1cDN9IEUZNsEFH8jc86uoexbpc6zMs3xRA9flDVKFm8Q-77qoQLnFv7EJETm9wDnVvFsL3RNU4kWMJ3OD1gtK3_QC5xQebZuAUbqbCMxs6IJMvJInAIUdqz78tUaysAXO4MHIt74hy8kuCJwR0tI8M11jf7OlQAH-LJtoOxmd0"
                          } 
                        />
                        {idx % 2 === 0 && (
                          <img 
                            alt="Collaborator 2" 
                            className="w-6 h-6 rounded-full border-2 border-surface-container-lowest object-cover" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB6Ie1n1GxIOUi78mxgpdeMMUrxs_p_rM9hfBteaw_ygWOYdUGYfGGrNyk4ozzEx1z8NO4kkNLkd8kIr18Mf9t4cdn8Lg2JGHBS1cDN9IEUZNsEFH8jc86uoexbpc6zMs3xRA9flDVKFm8Q-77qoQLnFv7EJETm9wDnVvFsL3RNU4kWMJ3OD1gtK3_QC5xQebZuAUbqbCMxs6IJMvJInAIUdqz78tUaysAXO4MHIt74hy8kuCJwR0tI8M11jf7OlQAH-LJtoOxmd0" 
                          />
                        )}
                      </div>
                      <span className="font-label-md text-xs text-on-surface-variant">
                        Updated {getRelativeTimeString(room.updatedAt)}
                      </span>
                    </div>
                  </Link>
                ))}

                {/* New Project Card */}
                <div 
                  onClick={handleOpenCreateModal}
                  className="glass-panel p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer border border-dashed border-outline-variant flex flex-col items-center justify-center text-center gap-sm min-h-[140px] hover:border-primary-container bg-surface-container-lowest/50"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">Create New Project</span>
                </div>
              </div>
            )}
          </section>

          {/* Cloud Environment Usage Stats */}
          <aside className="lg:col-span-4 flex flex-col gap-md">
            {/* Mini Activity Log */}
            <div className="glass-panel rounded-xl p-lg border border-surface-variant shadow-sm mt-md flex-1">
              <h3 className="font-label-md text-sm font-semibold text-on-surface mb-md">Recent Activity</h3>
              <ul className="space-y-sm">
                <li className="flex gap-sm items-start">
                  <div className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center shrink-0 mt-xs">
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant">commit</span>
                  </div>
                  <div>
                    <p className="font-label-md text-sm text-on-surface">
                      Pushed to <span className="font-code-md text-xs bg-surface-variant px-1 rounded">main</span> in {rooms[0]?.title || 'e-commerce-api'}
                    </p>
                    <span className="font-label-md text-xs text-on-surface-variant">10 mins ago</span>
                  </div>
                </li>
                <li className="flex gap-sm items-start">
                  <div className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center shrink-0 mt-xs">
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant">play_arrow</span>
                  </div>
                  <div>
                    <p className="font-label-md text-sm text-on-surface">
                      Started environment {rooms[1]?.title || 'ml-pipeline-v2'}
                    </p>
                    <span className="font-label-md text-xs text-on-surface-variant">1 hr ago</span>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

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
                  <option value="typescript">TypeScript (Node.js)</option>
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
