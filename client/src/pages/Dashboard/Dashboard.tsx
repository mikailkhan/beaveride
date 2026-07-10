import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import { mockRoomService } from '../../services/mocks/mockRoomService';
import BeaverideLogo from '../../assets/logos/beaveride-logo.png';

export const Dashboard = () => {
  const { rooms, setRooms } = useRoomStore();
  const { user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await mockRoomService.getRooms();
        setRooms(data);
      } catch (error) {
        console.error('Failed to load rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [setRooms]);

  const handleCreateRoom = async () => {
    try {
      const newRoom = await mockRoomService.createRoom('Untitled Room', 1);
      navigate(`/room/${newRoom.id}`);
    } catch (error) {
      console.error('Failed to create room', error);
    }
  };



  const getLanguageSubtext = (progLangId: number) => {
    switch (progLangId) {
      case 1: return 'Node.js • Express';
      case 2: return 'React • Tailwind';
      case 3: return 'Python • FastAPI';
      default: return 'Node.js • Custom';
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
            <img alt="BeaverIDE Logo" className="h-8 w-auto" src={BeaverideLogo} />
          </Link>
        </div>
        
        <div className="mb-lg px-sm">
          <div className="flex items-center gap-sm p-sm bg-surface rounded-lg border border-surface-variant mb-md cursor-pointer hover:bg-surface-container transition-colors">
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
            onClick={handleCreateRoom}
            className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-sm px-md rounded-lg flex items-center justify-center gap-xs hover:bg-primary hover:text-on-primary transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            New Project
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
          <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-highest transition-all rounded-lg font-label-md text-label-md active:translate-x-1" href="#templates">
            <span className="material-symbols-outlined">description</span>
            Templates
          </a>
          <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-highest transition-all rounded-lg font-label-md text-label-md active:translate-x-1" href="#settings">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </a>
          <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-highest transition-all rounded-lg font-label-md text-label-md active:translate-x-1" href="#help">
            <span className="material-symbols-outlined">help</span>
            Help
          </a>
        </div>

        <div className="mt-auto px-sm pt-md border-t border-surface-variant space-y-1">
          <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-highest transition-all rounded-lg font-label-md text-label-md" href="#feedback">
            <span className="material-symbols-outlined">chat_bubble</span>
            Feedback
          </a>
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
                onClick={handleCreateRoom}
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
                            {getLanguageSubtext(room.progLangId)}
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
                  onClick={handleCreateRoom}
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
            <h2 className="font-headline-md text-body-lg font-semibold text-on-surface mb-sm">Cloud Environment</h2>
            
            <div className="glass-panel rounded-xl p-lg border border-surface-variant shadow-sm space-y-md">
              {/* CPU Usage */}
              <div>
                <div className="flex justify-between items-end mb-xs">
                  <span className="font-label-md text-sm text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">memory</span>
                    CPU Usage
                  </span>
                  <span className="font-code-md text-sm font-semibold text-on-surface">45%</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div className="bg-primary-container h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              {/* RAM Usage */}
              <div>
                <div className="flex justify-between items-end mb-xs">
                  <span className="font-label-md text-sm text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">storage</span>
                    RAM (8GB Total)
                  </span>
                  <span className="font-code-md text-sm font-semibold text-on-surface">6.2 GB</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div className="bg-tertiary h-2 rounded-full" style={{ width: '77%' }}></div>
                </div>
              </div>
              
              {/* Storage */}
              <div>
                <div className="flex justify-between items-end mb-xs">
                  <span className="font-label-md text-sm text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">cloud</span>
                    Storage
                  </span>
                  <span className="font-code-md text-sm font-semibold text-on-surface">12 GB / 50 GB</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: '24%' }}></div>
                </div>
              </div>
              
              <div className="pt-md border-t border-surface-variant mt-md">
                <button className="w-full py-sm px-md rounded-lg border border-outline text-on-surface font-label-md text-sm hover:bg-surface-container-highest transition-colors cursor-pointer">
                  Manage Instances
                </button>
              </div>
            </div>

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
    </div>
  );
};
