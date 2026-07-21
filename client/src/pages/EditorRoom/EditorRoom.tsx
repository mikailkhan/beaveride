import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MonacoEditor } from '../../components/editor/MonacoEditor';
import { TerminalPanel } from '../../components/editor/TerminalPanel';
import { ChatPanel } from '../../components/editor/ChatPanel';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import { useYjsSync } from '../../hooks/useYjsSync';
import { roomService } from '../../services/roomService';
import BeaverideLogo from '../../assets/logos/beaveride-logo.png';
import { FileExplorer } from '../../components/editor/FileExplorer';
import { EditorTabs } from '../../components/editor/EditorTabs';
import { useFileStore } from '../../store/fileStore';
import { fileService } from '../../services/fileService';

type ActivityEventType = 'joined' | 'left' | 'global_run' | 'code_edit';

interface ActivityEntry {
  username: string;
  event: ActivityEventType;
  timestamp: string;
}

export const EditorRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  
  const { activeRoom, isLoading, error, fetchRoomDetails, clearActiveRoom } = useRoomStore();

  const { files, activeFileId, fetchFileTree, clearFileStore, updateFileContent, validationError } = useFileStore();
  const activeFile = files.find((f) => f.id === activeFileId) || null;

  const [editor, setEditor] = useState<any>(null);
  const [globalOutput, setGlobalOutput] = useState('');
  const [globalRunStatus, setGlobalRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [localOutput, setLocalOutput] = useState('');
  const [localRunStatus, setLocalRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'global' | 'local'>('global');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Debounced auto-save effect
  useEffect(() => {
    if (!activeFile || !roomId) return;

    setSaveStatus('saving');
    const delayDebounceFn = setTimeout(async () => {
      try {
        await fileService.updateFileContent(roomId, activeFile.id, activeFile.content || '');
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to auto-save file:', err);
        setSaveStatus('error');
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [activeFile?.content, activeFile?.id, roomId]);

  useEffect(() => {
    if (!roomId) return;
    fetchRoomDetails(roomId);
    fetchFileTree(roomId);

    return () => {
      clearActiveRoom();
      clearFileStore();
    };
  }, [roomId, fetchRoomDetails, clearActiveRoom, fetchFileTree, clearFileStore]);

  const token = useAuthStore((state) => state.token);

  const [showChat, setShowChat] = useState(false);
  const [isPresenceExpanded, setIsPresenceExpanded] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isExplorerExpanded, setIsExplorerExpanded] = useState(true);
  const [isActivityExpanded, setIsActivityExpanded] = useState(true);

  // Sync editor workspace using Yjs
  const { collaborators, socket } = useYjsSync({ roomId: roomId || '', token: token || '', editor });

  // Register socket listeners for global run lifecycle
  useEffect(() => {
    if (!socket) return;

    const onStart = ({ initiatedBy }: { initiatedBy: string }) => {
      setGlobalRunStatus('running');
      setGlobalOutput(`\r\n\x1b[33m[Global Run started by ${initiatedBy}...]\x1b[0m\r\n`);
    };

    const onOutput = ({ chunk }: { chunk: string }) => {
      setGlobalOutput(chunk);
    };

    const onEnd = ({ success }: { success: boolean }) => {
      setGlobalRunStatus(success ? 'success' : 'error');
    };

    const onLocked = ({ message }: { message: string }) => {
      setGlobalOutput(`\r\n\x1b[31m[${message}]\x1b[0m\r\n`);
    };

    const onActivityUpdate = (entries: ActivityEntry[]) => {
      setActivities(entries);
    };
    socket.on('activity:update', onActivityUpdate);

    socket.on('run:global:start', onStart);
    socket.on('run:global:output', onOutput);
    socket.on('run:global:end', onEnd);
    socket.on('run:global:locked', onLocked);

    return () => {
      socket.off('run:global:start', onStart);
      socket.off('run:global:output', onOutput);
      socket.off('run:global:end', onEnd);
      socket.off('run:global:locked', onLocked);
      socket.off('activity:update', onActivityUpdate);
    };
  }, [socket]);

  const handleGlobalRun = () => {
    if (!socket || !activeRoom || globalRunStatus === 'running') return;
    setActiveTab('global');
    const code = activeFile?.content || '';
    socket.emit('run:global', { code, language: activeRoom.language });
  };

  const handleLocalRun = async () => {
    if (!activeRoom || !roomId || localRunStatus === 'running') return;
    setActiveTab('local');
    setLocalRunStatus('running');
    setLocalOutput('\r\n\x1b[33m[Local Run started...]\x1b[0m\r\n');
    try {
      const code = activeFile?.content || '';
      const result = await roomService.runCode(roomId, code);
      setLocalOutput(result);
      setLocalRunStatus('success');
    } catch (err) {
      setLocalOutput((err as Error).message);
      setLocalRunStatus('error');
    }
  };

  const getLanguageType = (filename: string) => {
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.go')) return 'go';
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.json')) return 'json';
    return 'markdown';
  };

  const formatLanguageName = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'javascript': return 'JavaScript (Node.js)';
      case 'python': return 'Python 3';
      case 'go': return 'Go (Golang)';
      default: return lang.charAt(0).toUpperCase() + lang.slice(1);
    }
  };

  const formatActivity = (entry: ActivityEntry) => {
    switch (entry.event) {
      case 'joined':
        return {
          icon: 'login',
          label: `${entry.username} joined`,
          colorClass: 'text-green-600',
        };
      case 'left':
        return {
          icon: 'logout',
          label: `${entry.username} left`,
          colorClass: 'text-red-500',
        };
      case 'global_run':
        return {
          icon: 'play_arrow',
          label: `${entry.username} ran code`,
          colorClass: 'text-primary',
        };
      case 'code_edit':
        return {
          icon: 'edit',
          label: `${entry.username} edited code`,
          colorClass: 'text-tertiary',
        };
      default:
        return {
          icon: 'info',
          label: `${entry.username} performed action`,
          colorClass: 'text-outline',
        };
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface p-lg text-center gap-md">
        <div className="text-error text-3xl font-headline-md font-bold">Access Denied</div>
        <p className="text-on-surface-variant font-body-md">{error}</p>
        <Link to="/dashboard" className="px-md py-sm bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary rounded-lg font-label-md transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading || !activeRoom) {
    return (
      <div className="p-8 text-center text-on-surface-variant font-body-md bg-surface h-screen flex items-center justify-center">
        Loading room details...
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-on-surface font-body-md overflow-hidden flex font-[Inter] w-full">
      {/* Left Sidebar Menu */}
      <aside className={`h-screen bg-surface-container-low border-r border-outline-variant/30 flex flex-col justify-between py-md px-sm shrink-0 z-10 select-none transition-all duration-300 ${isSidebarExpanded ? 'w-[280px]' : 'w-[70px] items-center'}`}>
        <div className="px-sm w-full">
          <div className={`flex items-center mb-lg mt-sm ${isSidebarExpanded ? 'justify-between' : 'justify-center'}`}>
            {isSidebarExpanded && (
              <div className="flex items-center w-[140px] h-[54px] bg-surface-container-high rounded-lg overflow-hidden">
                <Link to="/dashboard">
                  <img src={BeaverideLogo} alt="BeaverIDE Logo" className="h-10 w-auto object-contain" />
                </Link>
              </div>
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
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-hidden flex flex-col gap-sm w-full">
          <div className="group flex-1 min-h-0 flex flex-col">
            <button
              onClick={() => isSidebarExpanded && setIsExplorerExpanded(!isExplorerExpanded)}
              className={`flex items-center gap-sm px-sm py-sm rounded-lg bg-primary-container text-on-primary-container font-bold shrink-0 w-full transition-colors hover:bg-primary-container/80 ${isSidebarExpanded ? '' : 'justify-center'}`}
              title="Explorer"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
              {isSidebarExpanded && <span className="font-label-md text-label-md">Explorer</span>}
              {isSidebarExpanded && (
                <span
                  className="material-symbols-outlined text-[16px] ml-auto transition-transform duration-200"
                  style={{ transform: isExplorerExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  chevron_right
                </span>
              )}
            </button>

            {isSidebarExpanded && validationError && (
              <div className="mx-xs mt-xs p-sm bg-error/10 text-error border border-error/20 rounded-lg flex items-start gap-xs text-[11px] font-medium leading-normal animate-fade-in shadow-[0_2px_8px_rgba(186,26,26,0.15)]">
                <span className="material-symbols-outlined text-[14px] text-error shrink-0 mt-[2px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Explorer Content */}
            {isSidebarExpanded && isExplorerExpanded && (
              <div className="flex-1 min-h-0 overflow-hidden mt-xs">
                <FileExplorer roomId={roomId || ''} />
              </div>
            )}
          </div>

          <a className={`flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all ${isSidebarExpanded ? '' : 'justify-center'}`} href="#search" title="Search">
            <span className="material-symbols-outlined text-[20px]">search</span>
            {isSidebarExpanded && <span className="font-label-md text-label-md">Search</span>}
          </a>
        
          <a className={`flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all ${isSidebarExpanded ? '' : 'justify-center'}`} href="#settings" title="Settings">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            {isSidebarExpanded && <span className="font-label-md text-label-md">Settings</span>}
          </a>
        </nav>

        {/* Footer Navigation */}
        <div className="mt-md pt-sm border-t border-outline-variant/30 flex flex-col gap-xs w-full">
          <Link className={`flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all ${isSidebarExpanded ? '' : 'justify-center'}`} to="/dashboard" title="Dashboard">
            <span className="material-symbols-outlined text-[20px]">folder_open</span>
            {isSidebarExpanded && <span className="font-label-md text-label-md">Dashboard</span>}
          </Link>
          <a className={`flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all relative ${isSidebarExpanded ? '' : 'justify-center'}`} href="#notifications" title="Notifications">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {isSidebarExpanded && <span className="font-label-md text-label-md">Notifications</span>}
            <span className={`absolute bg-primary rounded-full border border-surface-container-low ${isSidebarExpanded ? 'top-2 left-6 w-2 h-2' : 'top-1 right-2 w-1.5 h-1.5'}`}></span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface h-screen">
        {/* TopAppBar */}
        <header className="h-[60px] flex items-center justify-between px-md border-b border-outline-variant/20 bg-surface/80 backdrop-blur-xl z-20 shrink-0 select-none">
          {/* Breadcrumb */}
          <div className="flex items-center gap-sm font-label-md text-label-md">
            <span className="text-on-surface-variant">beaver-corp</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px] text-tertiary">cloud</span>
              {activeRoom.title}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[12px] font-bold ml-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              {formatLanguageName(activeRoom.language)} • {activeRoom.role}
            </span>

            {saveStatus === 'saving' && (
              <span className="text-xs text-on-surface-variant/70 flex items-center gap-xs ml-sm">
                <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-600/70 flex items-center gap-xs ml-sm" title="All changes saved to database">
                <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-error flex items-center gap-xs ml-sm" title="Failed to save changes">
                <span className="material-symbols-outlined text-[14px]">cloud_off</span>
                Save Error
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-sm">
            {/* Active Collaborators */}
            <div className="flex -space-x-2 mr-md">
              {collaborators.map((member) => (
                <div 
                  key={member.clientId} 
                  style={{ borderColor: member.color }}
                  className="w-8 h-8 rounded-full border-2 bg-surface-container-high flex items-center justify-center relative cursor-pointer group"
                >
                  <span className="text-label-md font-bold text-on-surface-variant text-xs">
                    {member.username.charAt(0).toUpperCase()}
                  </span>
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    <div className="font-label-md text-label-md font-bold text-on-surface">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-[12px] text-on-surface-variant">
                      @{member.username} (Online)
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Room link copied to clipboard!");
              }}
              className="px-md py-sm rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span> Invite
            </button>
            <button 
              onClick={() => alert("Workspace share settings opened.")}
              className="px-md py-sm rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">share</span> Share
            </button>
            <button 
              onClick={() => setShowChat((prev) => !prev)}
              className={`px-md py-sm rounded-lg border font-label-md text-label-md transition-colors flex items-center gap-xs cursor-pointer ${
                showChat 
                  ? 'bg-secondary-container border-secondary text-on-secondary-container' 
                  : 'border-outline-variant text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">chat</span> Chat
            </button>
            <button 
              onClick={handleGlobalRun} 
              disabled={globalRunStatus === 'running' || !activeRoom.canRun}
              className="px-md py-sm rounded-lg bg-primary-container text-white font-label-md text-label-md hover:bg-primary transition-colors flex items-center gap-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span> Global Run
            </button>
            <button 
              onClick={handleLocalRun} 
              disabled={localRunStatus === 'running' || !activeRoom.canRun}
              className="px-md py-sm rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md hover:bg-secondary hover:text-on-secondary transition-colors flex items-center gap-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span> Local Run
            </button>
          </div>
        </header>

        {/* Workspace Body (Editor + Chat Panel) */}
        <div className="flex-1 flex flex-row min-h-0 w-full overflow-hidden">
          {/* Editor & Panels Area */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Editor Header / Tabs */}
            <EditorTabs />

            {/* Monaco-inspired Editor Container */}
            <div className="flex-1 relative min-h-0">
              {activeFile ? (
                <MonacoEditor 
                  language={getLanguageType(activeFile.name)} 
                  value={activeFile.content || ''}
                  onChange={(val) => {
                    if (val !== undefined) {
                      updateFileContent(activeFile.id, val);
                    }
                  }}
                  onMount={(editorInstance) => setEditor(editorInstance)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/60 gap-sm select-none">
                  <span className="material-symbols-outlined text-4xl">code_blocks</span>
                  <span className="text-sm">Open a file from the explorer to start editing</span>
                </div>
              )}

              {/* Presence Panel (Right side floating) */}
              <div className="absolute top-md right-md flex flex-col gap-sm z-30 w-64 select-none pointer-events-auto">
                <div className="glass-panel rounded-xl p-sm bg-white/80 backdrop-blur-md border border-outline-variant/30 shadow-md">
                  <div 
                    onClick={() => setIsPresenceExpanded(!isPresenceExpanded)}
                    className="flex items-center justify-between cursor-pointer font-label-md text-label-md font-bold text-on-surface px-xs py-xs select-none hover:bg-surface-container-low rounded-lg transition-colors"
                  >
                    <span>Users Online ({collaborators.length})</span>
                    <span 
                      className="material-symbols-outlined text-[18px] transition-transform duration-200" 
                      style={{ transform: isPresenceExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      keyboard_arrow_down
                    </span>
                  </div>

                  {isPresenceExpanded && (
                    <div className="flex flex-col gap-1 mt-xs max-h-48 overflow-y-auto">
                      {collaborators.map((member) => (
                        <div 
                          key={member.clientId} 
                          className="flex items-center gap-sm p-xs rounded-lg hover:bg-surface-container-low transition-colors"
                        >
                          <div 
                            style={{ borderColor: member.color }}
                            className="w-6 h-6 rounded-full border-2 bg-surface-container-high flex items-center justify-center text-[10px] font-bold"
                          >
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-label-md text-[12px] font-bold text-on-surface truncate">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-[10px] text-on-surface-variant truncate">
                              @{member.username} (Online)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Activity Feed Panel */}
                <div className="glass-panel rounded-xl p-sm bg-white/80 backdrop-blur-md border border-outline-variant/30 shadow-md">
                  <div 
                    onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                    className="flex items-center justify-between cursor-pointer font-label-md text-label-md font-bold text-on-surface px-xs py-xs select-none hover:bg-surface-container-low rounded-lg transition-colors"
                  >
                    <span>Activity Feed</span>
                    <span 
                      className="material-symbols-outlined text-[18px] transition-transform duration-200" 
                      style={{ transform: isActivityExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      keyboard_arrow_down
                    </span>
                  </div>
                  {isActivityExpanded && (
                    <div className="flex flex-col gap-1 mt-xs max-h-48 overflow-y-auto">
                      {activities.slice(0, 20).map((entry, index) => {
                        const details = formatActivity(entry);
                        return (
                          <div key={index} className="flex items-center gap-xs p-xs rounded-lg text-[11px] text-on-surface-variant">
                            <span className={`material-symbols-outlined text-[14px] ${details.colorClass}`}>
                              {details.icon}
                            </span>
                            <span className="flex-1 truncate" title={details.label}>{details.label}</span>
                            <span className="text-[10px] text-outline shrink-0">
                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      {activities.length === 0 && (
                        <div className="text-[11px] text-outline px-xs py-xs">No activity yet.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Terminal (Bottom Panel) */}
            <TerminalPanel 
              globalOutput={globalOutput} 
              localOutput={localOutput}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <ChatPanel socket={socket} onClose={() => setShowChat(false)} />
          )}
        </div>
      </main>
    </div>
  );
};

