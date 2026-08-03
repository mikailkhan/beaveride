import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MonacoEditor } from '../../components/editor/MonacoEditor';
import { TerminalPanel } from '../../components/editor/TerminalPanel';
import { ChatPanel } from '../../components/editor/ChatPanel';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import { useYjsSync } from '../../hooks/useYjsSync';
import { useFileBinding } from '../../hooks/useFileBinding';
import { useRoomSocket } from '../../hooks/useRoomSocket';
import { roomService } from '../../services/roomService';
import { FileExplorer } from '../../components/editor/FileExplorer';
import { EditorTabs } from '../../components/editor/EditorTabs';
import { useFileStore } from '../../store/fileStore';
import { useLockStore } from '../../store/lockStore';
import { GlobalSearchModal } from '../../components/editor/GlobalSearchModal';
import { UsagePreviewModal } from '../../components/editor/UsagePreviewModal';
import type { ActivityEvent, ProjectFile, UsageScanResult } from '../../types';


export const EditorRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  
  const { activeRoom, isLoading, error, fetchRoomDetails, clearActiveRoom } = useRoomStore();

  const {
    files,
    activeFileId,
    fetchFileTree,
    clearFileStore,
    openFile,
    triggerTabVibration,
    validationError,
  } = useFileStore();
  const activeFile = files.find((f) => f.id === activeFileId) || null;

  const [editor, setEditor] = useState<any>(null);
  const [globalOutput, setGlobalOutput] = useState('');
  const [globalRunStatus, setGlobalRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [localOutput, setLocalOutput] = useState('');
  const [localRunStatus, setLocalRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
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

  // Usage lock modal state
  const [isUsageScanOpen, setIsUsageScanOpen] = useState(false);
  const [isUsageScanning, setIsUsageScanning] = useState(false);
  const [usageScanResult, setUsageScanResult] = useState<UsageScanResult | null>(null);
  const [pendingUsageLock, setPendingUsageLock] = useState<{
    fileId: number;
    unitName: string;
    startLine: number;
    endLine: number;
  } | null>(null);

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
      if (activeRoom.role) setMyRole(activeRoom.role);
      if (activeRoom.canRun !== undefined) setMyCanRun(activeRoom.canRun);
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
    }
  }, [awareness, activeFileId, myRole, myCanRun]);
  // Global keyboard shortcut listener for Cmd+Alt+L / Ctrl+Alt+L (Lock/Unlock entire file)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.altKey && e.code === 'KeyL') {
        const activeElement = document.activeElement;
        const isMonacoFocused = activeElement?.classList.contains('inputarea') || activeElement?.closest('.monaco-editor');
        if (isMonacoFocused) return;

        e.preventDefault();

        const targetFileId = activeFileId ? Number(activeFileId) : null;
        if (!targetFileId || isNaN(targetFileId) || !authUser || !socket) return;

        const currentLocks = useLockStore.getState().getLocks(targetFileId);
        const myLocks = currentLocks.filter(l => String(l.userId) === String(authUser.id));

        if (myLocks.length > 0) {
          myLocks.forEach(lock => {
            socket.emit('lock:release', { fileId: targetFileId, lockId: lock.id });
          });
        } else {
          const isLockedByOther = currentLocks.some(l => String(l.userId) !== String(authUser.id));
          if (!isLockedByOther) {
            socket.emit('lock:acquire', { fileId: targetFileId, lockScope: 'file' });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, authUser, socket]);

  // Handle usage lock request from Monaco context menu
  const handleRequestUsageLock = (data: {
    fileId: number;
    unitName: string;
    startLine: number;
    endLine: number;
  }) => {
    if (!socket) return;

    setPendingUsageLock(data);
    setIsUsageScanOpen(true);
    setIsUsageScanning(true);
    setUsageScanResult(null);

    socket.emit('lock:scan-usages', {
      fileId: data.fileId,
      unitName: data.unitName,
    });
  };

  // Handle usage scan result from server
  useEffect(() => {
    if (!socket) return;

    const onScanResult = (result: UsageScanResult) => {
      setUsageScanResult(result);
      setIsUsageScanning(false);
    };

    socket.on('lock:usage-scan-result', onScanResult);
    return () => {
      socket.off('lock:usage-scan-result', onScanResult);
    };
  }, [socket]);

  // Handle usage lock confirmation
  const handleConfirmUsageLock = () => {
    if (!socket || !pendingUsageLock || !usageScanResult) return;

    const usageSpans = usageScanResult.usages.map(u => ({
      fileId: u.fileId,
      startLine: u.startLine,
      endLine: u.endLine,
    }));

    socket.emit('lock:acquire-usage', {
      fileId: pendingUsageLock.fileId,
      unitName: pendingUsageLock.unitName,
      startLine: pendingUsageLock.startLine,
      endLine: pendingUsageLock.endLine,
      usageSpans,
    });

    setIsUsageScanOpen(false);
    setPendingUsageLock(null);
    setUsageScanResult(null);
  };

  const handleCloseUsageModal = () => {
    setIsUsageScanOpen(false);
    setPendingUsageLock(null);
    setUsageScanResult(null);
    setIsUsageScanning(false);
  };

  // Use custom socket hook for room mutations, member status updates, activities, and global run state
  const { activities } = useRoomSocket({
    socket,
    authUser,
    setMyRole,
    setMyCanRun,
    setGlobalRunStatus,
    setGlobalOutput,
  });

  const isRunnableFile = (file?: ProjectFile | null): boolean => {
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


  const getFileName = (fileId: string | null) => {
    if (!fileId) return 'No active file';
    const file = files.find((f) => f.id === fileId);
    return file ? file.name : 'Unknown file';
  };

  const formatActivity = (entry: ActivityEvent) => {
    const name = entry.actorName || (entry as any).username || 'System';
    const isAgent = entry.actorType === 'agent';
    const nameLabel = isAgent ? `🤖 ${name}` : name;
    const detail = (entry.metadata?.detail as string) || (entry as any).detail;

    const fileIdStr = entry.targetFileId ? String(entry.targetFileId) : null;
    const targetFile = fileIdStr ? files.find((f) => f.id === fileIdStr) : null;
    const fileName = targetFile ? targetFile.name : (fileIdStr ? `file #${fileIdStr}` : null);

    let icon = 'info';
    let actionPrefix = '';
    let targetFileName: string | null = fileName;
    let colorClass = 'text-primary';

    switch (entry.eventType || (entry as any).event) {
      case 'lock_granted':
      case 'file_locked':
        icon = 'lock';
        actionPrefix = `${nameLabel} locked`;
        colorClass = 'text-tertiary';
        break;
      case 'lock_released_explicit':
      case 'lock_released_disconnect':
      case 'lock_released_idle_timeout':
      case 'file_unlocked':
        icon = 'lock_open';
        actionPrefix = `${nameLabel} unlocked`;
        colorClass = 'text-primary';
        break;
      case 'lock_queued':
        icon = 'hourglass_empty';
        actionPrefix = `${nameLabel} queued for`;
        colorClass = 'text-amber-500';
        break;
      case 'lock_denied':
        icon = 'block';
        actionPrefix = `${nameLabel} lock request denied`;
        targetFileName = null;
        colorClass = 'text-red-500';
        break;
      case 'participant_joined':
      case 'joined':
        icon = 'login';
        actionPrefix = `${nameLabel} joined`;
        targetFileName = null;
        colorClass = 'text-green-600';
        break;
      case 'participant_left':
      case 'participant_disconnected':
      case 'left':
        icon = 'logout';
        actionPrefix = `${nameLabel} left`;
        targetFileName = null;
        colorClass = 'text-red-500';
        break;
      case 'global_run_started':
      case 'global_run':
        icon = 'play_arrow';
        actionPrefix = `${nameLabel} ran`;
        targetFileName = fileName || 'code';
        colorClass = 'text-primary';
        break;
      case 'code_edited':
      case 'code_edit':
        icon = 'edit';
        actionPrefix = `${nameLabel} edited`;
        targetFileName = fileName || 'code';
        colorClass = 'text-tertiary';
        break;
      case 'file_created':
        icon = 'note_add';
        actionPrefix = `${nameLabel} created`;
        colorClass = 'text-green-600';
        break;
      case 'file_renamed':
        icon = 'edit_note';
        actionPrefix = `${nameLabel} renamed`;
        colorClass = 'text-tertiary';
        break;
      case 'file_deleted':
        icon = 'delete';
        actionPrefix = `${nameLabel} deleted`;
        colorClass = 'text-red-500';
        break;
      case 'member_role_changed':
      case 'role_changed':
        icon = 'badge';
        actionPrefix = `${nameLabel} ${detail || 'updated role'}`;
        targetFileName = null;
        colorClass = 'text-primary';
        break;
      case 'member_run_toggled':
      case 'run_toggled':
        icon = 'bolt';
        actionPrefix = `${nameLabel} ${detail || 'updated run permissions'}`;
        targetFileName = null;
        colorClass = 'text-tertiary';
        break;
      case 'member_kicked':
      case 'kicked':
        icon = 'person_remove';
        actionPrefix = `${nameLabel} ${detail || 'kicked user'}`;
        targetFileName = null;
        colorClass = 'text-error';
        break;
      default:
        icon = 'info';
        actionPrefix = `${nameLabel} ${detail || 'performed action'}`;
        targetFileName = null;
        colorClass = 'text-outline';
        break;
    }

    return {
      icon,
      actionPrefix,
      targetFileName,
      targetFile,
      colorClass,
    };
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
              <div className="flex items-center">
                <Link to="/dashboard" className="px-2 text-on-surface font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
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
              {myRole.toUpperCase()}
            </span>

            {isViewer && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[11px] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">preview</span> Read Only Mode
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

            {/* Queue position notification banner */}
            {(() => {
              if (!activeFile) return null;
              const queuePos = useLockStore.getState().queuePositions.get(Number(activeFile.id));
              if (!queuePos) return null;
              return (
                <div className="flex items-center gap-xs px-sm py-1.5 bg-amber-500/10 text-amber-600 text-xs font-label-md border-b border-amber-500/20 shrink-0">
                  <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                  You are #{queuePos} in queue for this file. You will automatically receive the lock when it becomes available.
                </div>
              );
            })()}

            {/* Monaco-inspired Editor Container */}
            <div className="flex-1 relative min-h-0">
              {activeFile ? (() => {
                const isActiveFileLocked = useLockStore.getState().isFileLockedByOther(Number(activeFile.id), authUser ? Number(authUser.id) : 0);
                return (
                  <MonacoEditor 
                    key={activeFile.id}
                    fileId={Number(activeFile.id)}
                    language={getLanguageType(activeFile.name)} 
                    readOnly={isViewer || isActiveFileLocked}
                    onMount={(editorInstance) => setEditor(editorInstance)}
                    onRequestUsageLock={handleRequestUsageLock}
                  />
                );
              })() : (
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
                              <div className="flex-1 truncate flex items-center gap-1">
                                <span>{details.actionPrefix}</span>
                                {details.targetFileName && details.targetFile ? (
                                  <button
                                    onClick={() => {
                                      if (details.targetFile) {
                                        if (activeFileId === details.targetFile.id) {
                                          triggerTabVibration(details.targetFile.id);
                                        } else {
                                          openFile(details.targetFile);
                                        }
                                      }
                                    }}
                                    className="font-semibold text-primary hover:underline hover:text-primary-container cursor-pointer transition-colors"
                                    title={`Click to open ${details.targetFile.name}`}
                                  >
                                    {details.targetFileName}
                                  </button>
                                ) : details.targetFileName ? (
                                  <span className="font-semibold text-on-surface">{details.targetFileName}</span>
                                ) : null}
                              </div>
                              <span className="text-[10px] text-outline shrink-0">
                                {new Date(entry.occurredAt || (entry as any).timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Usage Lock Preview Modal */}
      <UsagePreviewModal
        isOpen={isUsageScanOpen}
        onClose={handleCloseUsageModal}
        onConfirm={handleConfirmUsageLock}
        scanResult={usageScanResult}
        unitName={pendingUsageLock?.unitName ?? ''}
        isLoading={isUsageScanning}
      />
    </div>
  );
};
