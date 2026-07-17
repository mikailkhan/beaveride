import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MonacoEditor } from '../../components/editor/MonacoEditor';
import { TerminalPanel } from '../../components/editor/TerminalPanel';
import { ChatPanel } from '../../components/editor/ChatPanel';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import { useYjsSync } from '../../hooks/useYjsSync';
import { mockEditorService } from '../../services/mocks/mockEditorService';
import BeaverideLogo from '../../assets/logos/beaveride-logo.png';

const getDefaultFileInfo = (language: string) => {
  const lang = language.toLowerCase();
  if (lang === 'typescript') {
    return {
      filename: 'main.ts',
      code: `// TypeScript execution environment\nconst message: string = "Hello, TypeScript!";\nconsole.log(message);\n`,
    };
  }
  if (lang === 'python') {
    return {
      filename: 'main.py',
      code: `# Python 3 execution environment\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Beaver"))\n`,
    };
  }
  if (lang === 'go') {
    return {
      filename: 'main.go',
      code: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Go!")\n}\n`,
    };
  }
  // Default to javascript
  return {
    filename: 'main.js',
    code: `// JavaScript (Node.js) execution environment\nconst name = "Beaver";\nconsole.log(\`Hello, \${name}!\`);\n`,
  };
};

export const EditorRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { activeRoom, isLoading, error, fetchRoomDetails, clearActiveRoom } = useRoomStore();

  const [editor, setEditor] = useState<any>(null);
  const [activeFile, setActiveFile] = useState('main.js');
  const [files, setFiles] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!roomId) return;
    fetchRoomDetails(roomId);

    return () => {
      clearActiveRoom();
    };
  }, [roomId, fetchRoomDetails, clearActiveRoom]);

  const token = useAuthStore((state) => state.token);

  const [showChat, setShowChat] = useState(false);

  // Sync editor workspace using Yjs
  const { collaborators, socket } = useYjsSync({ roomId: roomId || '', token: token || '', editor });

  // Set up initial file and code snippet once the room is loaded
  useEffect(() => {
    if (activeRoom) {
      const fileInfo = getDefaultFileInfo(activeRoom.language);
      setActiveFile(fileInfo.filename);
      setFiles({
        [fileInfo.filename]: fileInfo.code,
      });
    }
  }, [activeRoom]);

  const handleRun = async () => {
    if (!activeRoom) return;
    setStatus('running');
    setOutput('Starting execution environment...');
    
    try {
      const code = editor ? editor.getValue() : '';
      const result = await mockEditorService.executeCode(activeRoom.language, code);
      setOutput(result);
      setStatus('success');
    } catch (error) {
      setOutput((error as Error).message);
      setStatus('error');
    }
  };

  const handleFileClick = (filename: string) => {
    setActiveFile(filename);
  };

  const getLanguageType = (filename: string) => {
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.go')) return 'go';
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.json')) return 'json';
    return 'markdown';
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.js')) {
      return <span className="material-symbols-outlined text-[16px] text-[#f0db4f]">javascript</span>;
    }
    if (filename.endsWith('.ts')) {
      return <span className="material-symbols-outlined text-[16px] text-[#007acc]">code</span>;
    }
    if (filename.endsWith('.go')) {
      return <span className="material-symbols-outlined text-[16px] text-[#00add8]">code</span>;
    }
    if (filename.endsWith('.py')) {
      return <span className="material-symbols-outlined text-[16px] text-[#3572A5]">code</span>;
    }
    if (filename.endsWith('.css')) {
      return <span className="material-symbols-outlined text-[16px] text-secondary">css</span>;
    }
    if (filename.endsWith('.json')) {
      return <span className="material-symbols-outlined text-[16px] text-[#cb3837]">settings</span>;
    }
    return <span className="material-symbols-outlined text-[16px] text-outline">description</span>;
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
      <aside className="h-screen w-[280px] bg-surface-container-low border-r border-outline-variant/30 flex flex-col justify-between py-md px-sm shrink-0 z-10 select-none">
        <div className="mb-lg px-sm">
          <div className="flex items-center justify-center mb-lg w-[140px] h-[54px] bg-surface-container-high rounded-lg overflow-hidden mt-sm">
            <Link to="/dashboard">
              <img src={BeaverideLogo} alt="BeaverIDE Logo" className="h-10 w-auto object-contain" />
            </Link>
          </div>
          <button 
            onClick={() => alert("Creating a new file... (mock)")}
            className="w-full bg-primary-container text-white rounded-lg font-label-md text-label-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-primary transition-colors flex items-center justify-center gap-xs py-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> New File
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto flex flex-col gap-sm">
          <div className="group">
            <div className="flex items-center gap-sm px-sm py-sm rounded-lg bg-primary-container text-on-primary-container font-bold">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
              <span className="font-label-md text-label-md">Explorer</span>
              <span className="material-symbols-outlined text-[16px] ml-auto rotate-90">chevron_right</span>
            </div>
            
            {/* Explorer Content */}
            <div className="pl-md pr-sm py-xs flex flex-col gap-xs mt-xs">
              <div className="flex items-center gap-xs px-sm py-xs rounded hover:bg-surface-container-high cursor-pointer text-on-surface font-label-md text-label-md">
                <span className="material-symbols-outlined text-[16px] text-tertiary">folder</span> src
              </div>
              <div className="pl-md flex flex-col gap-xs">
                {Object.keys(files).map((filename) => (
                  <div 
                    key={filename}
                    onClick={() => handleFileClick(filename)}
                    className={`flex items-center gap-xs px-sm py-xs rounded hover:bg-surface-container-high cursor-pointer text-on-surface font-label-md text-label-md ${activeFile === filename ? 'bg-surface-container-high' : ''}`}
                  >
                    {getFileIcon(filename)} {filename}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <a className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all" href="#search">
            <span className="material-symbols-outlined text-[20px]">search</span>
            <span className="font-label-md text-label-md">Search</span>
          </a>
        
          <a className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all" href="#settings">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="font-label-md text-label-md">Settings</span>
          </a>
        </nav>

        {/* Footer Navigation */}
        <div className="mt-md pt-sm border-t border-outline-variant/30 flex flex-col gap-xs">
          <Link className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all" to="/dashboard">
            <span className="material-symbols-outlined text-[20px]">folder_open</span>
            <span className="font-label-md text-label-md">Dashboard</span>
          </Link>
          <a className="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all relative" href="#notifications">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="font-label-md text-label-md">Notifications</span>
            <span className="absolute top-2 left-6 w-2 h-2 bg-primary rounded-full border border-surface-container-low"></span>
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
              onClick={handleRun} 
              disabled={status === 'running' || !activeRoom.canRun}
              className="px-md py-sm rounded-lg bg-primary-container text-white font-label-md text-label-md hover:bg-primary transition-colors flex items-center gap-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span> Run
            </button>
          </div>
        </header>

        {/* Workspace Body (Editor + Chat Panel) */}
        <div className="flex-1 flex flex-row min-h-0 w-full overflow-hidden">
          {/* Editor & Panels Area */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Editor Header / Tabs */}
            <div className="h-[40px] flex bg-surface-container-lowest border-b border-outline-variant/20 shrink-0 select-none">
              {Object.keys(files).map((filename) => (
                <div 
                  key={filename}
                  onClick={() => handleFileClick(filename)}
                  className={`flex items-center gap-sm px-md border-r border-outline-variant/20 font-label-md text-label-md cursor-pointer transition-colors ${activeFile === filename ? 'bg-[#ffffff] border-b-2 border-b-primary text-on-surface' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                  {getFileIcon(filename)} {filename}
                </div>
              ))}
            </div>

            {/* Monaco-inspired Editor Container */}
            <div className="flex-1 relative min-h-0">
              <MonacoEditor 
                language={getLanguageType(activeFile)} 
                onMount={(editorInstance) => setEditor(editorInstance)}
              />

              {/* Presence Panel (Right side floating) */}
              <div className="absolute top-md right-md flex flex-col gap-sm z-30 w-64 select-none pointer-events-auto">
                <div className="glass-panel rounded-xl p-sm bg-white/80 backdrop-blur-md border border-outline-variant/30 shadow-md">
                  <h3 className="font-label-md text-label-md font-bold text-on-surface mb-xs px-xs">Users Online ({collaborators.length})</h3>
                  <div className="flex flex-col gap-1">
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
                </div>
              </div>
            </div>

            {/* Terminal (Bottom Panel) */}
            <TerminalPanel output={output} />
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

