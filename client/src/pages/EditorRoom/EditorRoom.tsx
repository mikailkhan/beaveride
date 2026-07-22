import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MonacoEditor } from '../../components/editor/MonacoEditor';
import { TerminalPanel } from '../../components/editor/TerminalPanel';
import { ChatPanel } from '../../components/editor/ChatPanel';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import { useYjsSync } from '../../hooks/useYjsSync';
import { useFileBinding } from '../../hooks/useFileBinding';
import { roomService } from '../../services/roomService';
import BeaverideLogo from '../../assets/logos/beaveride-logo.png';
import { FileExplorer } from '../../components/editor/FileExplorer';
import { EditorTabs } from '../../components/editor/EditorTabs';
import { useFileStore } from '../../store/fileStore';
import { GlobalSearchModal } from '../../components/editor/GlobalSearchModal';

type ActivityEventType = 
  | 'joined' 
  | 'left' 
  | 'global_run' 
  | 'code_edit' 
  | 'role_changed' 
  | 'run_toggled' 
  | 'kicked';

interface ActivityEntry {
  username: string;
  event: ActivityEventType;
  timestamp: string;
  targetUsername?: string;
  detail?: string;
}

export const EditorRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  
  const { activeRoom, isLoading, error, fetchRoomDetails, clearActiveRoom } = useRoomStore();

  const {
    files,
    activeFileId,
    fetchFileTree,
    clearFileStore,
    validationError,
    setSocket,
    addNodeFromSocket,
    renameNodeFromSocket,
    deleteNodeFromSocket
  } = useFileStore();
  const activeFile = files.find((f) => f.id === activeFileId) || null;

  const [editor, setEditor] = useState<any>(null);
  const [globalOutput, setGlobalOutput] = useState('');
  const [globalRunStatus, setGlobalRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [localOutput, setLocalOutput] = useState('');
  const [localRunStatus, setLocalRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'global' | 'local'>('global');

  // Role and Permission states
  const [myRole, setMyRole] = useState<'owner' | 'editor' | 'viewer'>('editor');
  const [myCanRun, setMyCanRun] = useState<boolean>(true);
  const [openRoleMenuUserId, setOpenRoleMenuUserId] = useState<number | null>(null);

  // Auth state
  const authUser = useAuthStore((state) => state.user);

  // Panel visibility states for Users Online and Activity Feed
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global keyboard shortcut (Cmd+K / Ctrl+K) for Search Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    fetchRoomDetails(roomId);
    fetchFileTree(roomId);

    return () => {
      clearActiveRoom();
      clearFileStore();
    };
  }, [roomId, fetchRoomDetails, clearActiveRoom, fetchFileTree, clearFileStore]);

  // Sync activeRoom roles/permissions to local state when activeRoom is loaded
  useEffect(() => {
    if (activeRoom) {
      setMyRole(activeRoom.role);
      setMyCanRun(activeRoom.canRun);
    }
  }, [activeRoom]);

  const token = useAuthStore((state) => state.token);

  const [showChat, setShowChat] = useState(false);
  const [isPresenceExpanded, setIsPresenceExpanded] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isExplorerExpanded, setIsExplorerExpanded] = useState(true);
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);

  // Sidebar resizing state & handlers
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(450, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  // Sync editor workspace using Yjs
  const { collaborators, socket, doc, awareness, isSynced } = useYjsSync({ roomId: roomId || '', token: token || '' });

  // Dynamically bind Monaco editor to active file's Y.Text inside Yjs doc
  useFileBinding({ doc, awareness, editor, activeFileId, isSynced, files });

  // Handle local activeFileId, role, and canRun updates in Yjs awareness
  useEffect(() => {
    if (awareness) {
      if (activeFileId) {
        awareness.setLocalStateField('activeFileId', activeFileId);
      }
      awareness.setLocalStateField('role', myRole);
      awareness.setLocalStateField('canRun', myCanRun);
    }
  }, [awareness, activeFileId, myRole, myCanRun]);

  // Sync socket state in fileStore and listen to broadcast mutations & member management events
  useEffect(() => {
    if (!socket) return;
    setSocket(socket);

    const currentUserId = authUser?.id;

    const { addNodeFromSocket, renameNodeFromSocket, moveNodeFromSocket, deleteNodeFromSocket } = useFileStore.getState();

    const onFiletreeMutate = (data: { type: string; fileId?: string; newName?: string; targetParentId?: string | null; node?: any }) => {
      console.log('Received filetree mutation event:', data);
      if (data.type === 'create' && data.node) {
        addNodeFromSocket(data.node);
      } else if (data.type === 'rename' && data.fileId && data.newName) {
        renameNodeFromSocket(data.fileId, data.newName);
      } else if (data.type === 'move' && data.fileId) {
        moveNodeFromSocket(data.fileId, data.targetParentId ?? null);
      } else if (data.type === 'delete' && data.fileId) {
        deleteNodeFromSocket(data.fileId);
      }
    };

    const onMemberUpdated = (data: { targetUserId: number; role?: 'owner' | 'editor' | 'viewer'; canRun?: boolean }) => {
      console.log('Received member updated event:', data);
      if (currentUserId && String(data.targetUserId) === String(currentUserId)) {
        if (data.role) setMyRole(data.role);
        if (data.canRun !== undefined) setMyCanRun(data.canRun);
      }
    };

    const onMemberKicked = (data: { targetUserId: number }) => {
      if (currentUserId && String(data.targetUserId) === String(currentUserId)) {
        alert("You have been removed from this room by the owner.");
        window.location.href = '/dashboard';
      }
    };

    socket.on('filetree:mutate', onFiletreeMutate);
    socket.on('room:member:updated', onMemberUpdated);
    socket.on('room:member:kicked', onMemberKicked);

    return () => {
      socket.off('filetree:mutate', onFiletreeMutate);
      socket.off('room:member:updated', onMemberUpdated);
      socket.off('room:member:kicked', onMemberKicked);
      setSocket(null);
    };
  }, [socket, setSocket, addNodeFromSocket, renameNodeFromSocket, deleteNodeFromSocket, authUser]);

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

  const isRunnableFile = (file?: FileNode | null): boolean => {
    if (!file || file.type !== 'file') return false;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'py', 'go'].includes(ext);
  };

  const isRunnable = isRunnableFile(activeFile);

  const getExecutionLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'mjs':
      case 'cjs':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return 'javascript';
      case 'py':
        return 'python';
      case 'go':
        return 'go';
      default:
        return activeRoom?.language || 'javascript';
    }
  };

  const handleGlobalRun = () => {
    if (!socket || !activeRoom || globalRunStatus === 'running' || !myCanRun || !isRunnable) return;
    setActiveTab('global');
    const executionLang = activeFile ? getExecutionLanguage(activeFile.name) : activeRoom.language;
    socket.emit('run:global', { entryFileId: activeFileId || undefined, language: executionLang });
  };

  const handleLocalRun = async () => {
    if (!activeRoom || !roomId || localRunStatus === 'running' || !isRunnable) return;
    setActiveTab('local');
    setLocalRunStatus('running');
    setLocalOutput('\r\n\x1b[33m[Local Run started...]\x1b[0m\r\n');
    try {
      const code = editor ? editor.getValue() : (activeFile?.content || '');
      const executionLang = activeFile ? getExecutionLanguage(activeFile.name) : activeRoom.language;
      const result = await roomService.runCode(roomId, code, executionLang, activeFileId || undefined);
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

  const getFileName = (fileId: string | null) => {
    if (!fileId) return 'No active file';
    const file = files.find((f) => f.id === fileId);
    return file ? file.name : 'Unknown file';
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
      case 'role_changed':
        return {
          icon: 'badge',
          label: `${entry.username} ${entry.detail || 'updated role'}`,
          colorClass: 'text-primary',
        };
      case 'run_toggled':
        return {
          icon: 'bolt',
          label: `${entry.username} ${entry.detail || 'updated run permissions'}`,
          colorClass: 'text-tertiary',
        };
      case 'kicked':
        return {
          icon: 'person_remove',
          label: `${entry.username} ${entry.detail || 'kicked user'}`,
          colorClass: 'text-error',
        };
      default:
        return {
          icon: 'info',
          label: `${entry.username} performed action`,
          colorClass: 'text-outline',
        };
    }
  };

  const handleRoleSelect = (targetUserId: number, targetUsername: string, newRole: 'owner' | 'editor' | 'viewer') => {
    if (!socket) return;
    socket.emit('room:member:update_role', {
      targetUserId,
      role: newRole,
      targetUsername,
    });
    setOpenRoleMenuUserId(null);
  };

  const handleToggleCanRun = (targetUserId: number, targetUsername: string, currentCanRun?: boolean) => {
    if (!socket) return;
    const nextCanRun = !(currentCanRun !== false);
    socket.emit('room:member:toggle_can_run', {
      targetUserId,
      canRun: nextCanRun,
      targetUsername,
    });
  };

  const handleKickUser = (targetUserId: number, targetUsername: string) => {
    if (!socket) return;
    if (window.confirm(`Are you sure you want to kick ${targetUsername} from this room?`)) {
      socket.emit('room:member:kick', {
        targetUserId,
        targetUsername,
      });
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

  const isViewer = myRole === 'viewer';

  return (
    <div className="h-screen bg-background text-on-surface font-body-md overflow-hidden flex font-[Inter] w-full">
      {/* Left Sidebar Menu */}
      <aside
        style={{ width: isSidebarExpanded ? `${sidebarWidth}px` : '70px' }}
        className={`h-screen bg-white border-r border-[#e8e8ed] flex flex-col justify-between py-md px-sm shrink-0 z-10 select-none relative ${
          isResizingSidebar ? '' : 'transition-[width] duration-300'
        } ${isSidebarExpanded ? '' : 'items-center'}`}
      >
        <div className="px-sm w-full">
          <div className={`flex items-center mb-lg mt-sm ${isSidebarExpanded ? 'justify-between' : 'justify-center'}`}>
            {isSidebarExpanded && (
              <div className="flex items-center w-[140px] h-[54px] bg-[#f5f5f7] rounded-lg overflow-hidden border border-[#e8e8ed]">
                <Link to="/dashboard" className="px-2">
                  <img src={BeaverideLogo} alt="BeaverIDE Logo" className="h-8 w-auto object-contain" />
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
              className={`flex items-center gap-sm px-sm py-sm rounded-lg bg-primary-container text-on-primary-container font-bold shrink-0 w-full transition-colors hover:bg-primary hover:text-on-primary ${isSidebarExpanded ? '' : 'justify-center'}`}
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

          <button 
            onClick={() => setIsSearchOpen(true)}
            className={`flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 hover:text-primary transition-all w-full text-left cursor-pointer ${isSidebarExpanded ? '' : 'justify-center'}`} 
            title="Search (Cmd+K)"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
            {isSidebarExpanded && <span className="font-label-md text-label-md">Search</span>}
          </button>

          {/* Button 1: Users Online Panel Toggle */}
          <button 
            onClick={() => {
              setShowUsersPanel((prev) => {
                const next = !prev;
                if (next && !isPresenceExpanded) setIsPresenceExpanded(true);
                return next;
              });
            }}
            className={`flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 hover:text-primary transition-all w-full text-left cursor-pointer ${isSidebarExpanded ? '' : 'justify-center'}`} 
            title={showUsersPanel ? "Hide Users Online" : "Show Users Online"}
          >
            <span className={`material-symbols-outlined text-[20px] transition-colors ${showUsersPanel ? 'text-primary' : 'text-on-surface-variant'}`}>
              group
            </span>
            {isSidebarExpanded && <span className="font-label-md text-label-md">Users</span>}
          </button>

          {/* Button 2: Activity Feed Panel Toggle */}
          <button 
            onClick={() => {
              setShowActivityPanel((prev) => {
                const next = !prev;
                if (next && !isActivityExpanded) setIsActivityExpanded(true);
                return next;
              });
            }}
            className={`flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 hover:text-primary transition-all w-full text-left cursor-pointer ${isSidebarExpanded ? '' : 'justify-center'}`} 
            title={showActivityPanel ? "Hide Activity Feed" : "Show Activity Feed"}
          >
            <span className={`material-symbols-outlined text-[20px] transition-colors ${showActivityPanel ? 'text-primary' : 'text-on-surface-variant'}`}>
              history
            </span>
            {isSidebarExpanded && <span className="font-label-md text-label-md">Activity</span>}
          </button>
        </nav>

        {/* Footer Navigation */}
        <div className="mt-md pt-sm border-t border-[#e8e8ed] flex flex-col gap-xs w-full">
          <Link className={`flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-primary-container/10 hover:text-primary transition-all ${isSidebarExpanded ? '' : 'justify-center'}`} to="/dashboard" title="Dashboard">
            <span className="material-symbols-outlined text-[20px]">folder_open</span>
            {isSidebarExpanded && <span className="font-label-md text-label-md">Dashboard</span>}
          </Link>
        </div>

        {/* Resize Handle */}
        {isSidebarExpanded && (
          <div
            onMouseDown={handleMouseDown}
            className={`absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-primary/45 transition-colors z-20 ${
              isResizingSidebar ? 'bg-primary/50' : 'bg-transparent'
            }`}
          />
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface h-screen">
        {/* TopAppBar */}
        <header className="h-[60px] flex items-center justify-between px-md border-b border-outline-variant/20 bg-surface/80 backdrop-blur-xl z-20 shrink-0 select-none">
          {/* Breadcrumb */}
          <div className="flex items-center gap-sm font-label-md text-label-md">
            <span className="text-on-surface font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px] text-tertiary">cloud</span>
              {activeRoom.title}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[12px] font-bold ml-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              {formatLanguageName(activeRoom.language)} • {myRole.toUpperCase()}
            </span>

            {isViewer && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[11px] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">preview</span> Read Only Mode
              </span>
            )}

            <span className="text-xs text-green-600/70 flex items-center gap-xs ml-sm" title="Real-time collaboration active">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              Live Syncing
            </span>
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
                    <div className="font-label-md text-label-md text-on-surface font-bold">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-[12px] text-on-surface-variant">
                      @{member.username} (Online)
                    </div>
                    <div className="text-[10px] text-primary font-semibold mt-0.5">
                      Editing: {getFileName(member.activeFileId)}
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
            {/* Global Run Button */}
            <div className="relative group inline-flex items-center">
              <button 
                onClick={handleGlobalRun} 
                disabled={globalRunStatus === 'running' || !activeRoom.canRun || !myCanRun || !isRunnable}
                className="px-md py-sm rounded-lg bg-primary-container text-white font-label-md text-label-md hover:bg-primary transition-colors flex items-center gap-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                title={!myCanRun ? "Global Run disabled by owner" : !isRunnable ? "Execution is only supported for JS, Python, and Go files" : "Execute code globally"}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span> Global Run
              </button>
              {(!isRunnable || !myCanRun) && (
                <div className="absolute top-full mt-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap bg-surface-container-highest/95 backdrop-blur-md text-on-surface text-[11px] font-medium px-sm py-xs rounded-md shadow-lg border border-outline-variant/30 flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">info</span>
                  {!myCanRun
                    ? "Global Run disabled by owner"
                    : !activeFile
                    ? "No file selected"
                    : `Execution unsupported for .${activeFile.name.split('.').pop() || 'file'} files`}
                </div>
              )}
            </div>

            {/* Local Run Button */}
            <div className="relative group inline-flex items-center">
              <button 
                onClick={handleLocalRun} 
                disabled={localRunStatus === 'running' || !activeRoom.canRun || !isRunnable}
                className="px-md py-sm rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md hover:bg-secondary hover:text-on-secondary transition-colors flex items-center gap-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                title={!isRunnable ? "Execution is only supported for JS, Python, and Go files" : "Execute code locally"}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span> Local Run
              </button>
              {!isRunnable && (
                <div className="absolute top-full mt-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap bg-surface-container-highest/95 backdrop-blur-md text-on-surface text-[11px] font-medium px-sm py-xs rounded-md shadow-lg border border-outline-variant/30 flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">info</span>
                  {!activeFile
                    ? "No file selected"
                    : `Execution unsupported for .${activeFile.name.split('.').pop() || 'file'} files`}
                </div>
              )}
            </div>
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
                  options={{ readOnly: isViewer }}
                  onMount={(editorInstance) => setEditor(editorInstance)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/60 gap-sm select-none">
                  <span className="material-symbols-outlined text-4xl">code_blocks</span>
                  <span className="text-sm">Open a file from the explorer to start editing</span>
                </div>
              )}

              {/* Presence Panel (Right side floating) */}
              <div className="absolute top-md right-md flex flex-col gap-sm z-30 w-72 select-none pointer-events-auto">
                {/* Users Online Panel */}
                {showUsersPanel && (
                  <div className="glass-panel rounded-xl p-sm bg-white/80 backdrop-blur-md border border-outline-variant/30 shadow-md transition-all duration-300 ease-in-out transform animate-fade-in">
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
                    <div className="flex flex-col gap-1.5 mt-xs max-h-60 overflow-y-auto pr-0.5">
                      {collaborators.map((member) => {
                        const isMemberOwner = member.role === 'owner';
                        const isMemberViewer = member.role === 'viewer';
                        const isMe = authUser?.id !== undefined && String(authUser.id) === String(member.userId);
                        const isMenuOpen = openRoleMenuUserId === member.userId;

                        return (
                          <div 
                            key={member.clientId} 
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container-low transition-colors relative"
                          >
                            {/* Avatar */}
                            <div 
                              style={{ borderColor: member.color }}
                              className="w-6 h-6 rounded-full border-2 bg-surface-container-high flex items-center justify-center text-[10px] font-bold shrink-0"
                            >
                              {member.username.charAt(0).toUpperCase()}
                            </div>

                            {/* User details */}
                            <div className="flex-1 min-w-0">
                              <div className="font-label-md text-[12px] font-bold text-on-surface truncate flex items-center gap-1">
                                <span>{member.firstName} {member.lastName}</span>
                                {isMe && <span className="text-[10px] text-outline font-normal">(You)</span>}
                              </div>
                              <div className="text-[10px] text-on-surface-variant truncate">
                                @{member.username} • {getFileName(member.activeFileId)}
                              </div>
                            </div>

                            {/* Role Icon & Selector */}
                            <div className="relative shrink-0 flex items-center gap-1">
                              {/* Role Icon Button */}
                              {myRole === 'owner' && !isMe && !isMemberOwner ? (
                                <button
                                  onClick={() => setOpenRoleMenuUserId(isMenuOpen ? null : member.userId)}
                                  className="p-1 rounded hover:bg-surface-container-high transition-colors flex items-center gap-0.5 cursor-pointer"
                                  title={`Current role: ${member.role || 'editor'}. Click to change.`}
                                >
                                  <span className={`material-symbols-outlined text-[16px] ${isMemberViewer ? 'text-outline' : 'text-primary'}`}>
                                    {isMemberViewer ? 'preview' : 'edit_note'}
                                  </span>
                                  <span className="material-symbols-outlined text-[12px] text-outline">arrow_drop_down</span>
                                </button>
                              ) : (
                                <span className="p-1 flex items-center" title={`Role: ${member.role || 'editor'}`}>
                                  <span className={`material-symbols-outlined text-[16px] ${isMemberOwner ? 'text-amber-500' : isMemberViewer ? 'text-outline' : 'text-primary'}`}>
                                    {isMemberOwner ? 'workspace_premium' : isMemberViewer ? 'preview' : 'edit_note'}
                                  </span>
                                </span>
                              )}

                              {/* Role Select Dropdown Menu */}
                              {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-outline-variant/30 rounded-lg shadow-lg p-1 z-50 flex flex-col gap-0.5 min-w-[100px]">
                                  <button
                                    onClick={() => handleRoleSelect(member.userId, member.username, 'editor')}
                                    className={`flex items-center gap-1.5 px-2 py-1 text-[11px] rounded hover:bg-surface-container-low transition-colors w-full text-left font-medium ${
                                      member.role !== 'viewer' ? 'text-primary font-bold' : 'text-on-surface'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">edit_note</span>
                                    Editor
                                  </button>
                                  <button
                                    onClick={() => handleRoleSelect(member.userId, member.username, 'viewer')}
                                    className={`flex items-center gap-1.5 px-2 py-1 text-[11px] rounded hover:bg-surface-container-low transition-colors w-full text-left font-medium ${
                                      member.role === 'viewer' ? 'text-primary font-bold' : 'text-on-surface'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">preview</span>
                                    Viewer
                                  </button>
                                </div>
                              )}

                              {/* Owner controls: Global Run Toggle & Kick */}
                              {myRole === 'owner' && !isMe && !isMemberOwner && (
                                <>
                                  <button
                                    onClick={() => handleToggleCanRun(member.userId, member.username, member.canRun)}
                                    className={`p-1 rounded hover:bg-surface-container-high transition-colors cursor-pointer ${
                                      member.canRun !== false ? 'text-primary' : 'text-outline-variant'
                                    }`}
                                    title={member.canRun !== false ? "Disable Global Run for this user" : "Enable Global Run for this user"}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      {member.canRun !== false ? 'play_circle' : 'play_disabled'}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => handleKickUser(member.userId, member.username)}
                                    className="p-1 rounded hover:bg-error-container/20 text-error transition-colors cursor-pointer"
                                    title="Kick User from Room"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">person_remove</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                )}

                {/* Activity Feed Panel */}
                {showActivityPanel && (
                  <div className="glass-panel rounded-xl p-sm bg-white/80 backdrop-blur-md border border-outline-variant/30 shadow-md transition-all duration-300 ease-in-out transform animate-fade-in">
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
                )}
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

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        doc={doc}
        editor={editor}
      />
    </div>
  );
};
