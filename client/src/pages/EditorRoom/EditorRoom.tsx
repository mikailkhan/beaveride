import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MonacoEditor } from '../../components/editor/MonacoEditor';
import { TerminalPanel } from '../../components/editor/TerminalPanel';
import { useRoomStore } from '../../store/roomStore';
import { mockRoomService } from '../../services/mocks/mockRoomService';
import { mockEditorService } from '../../services/mocks/mockEditorService';
import BeaverideLogo from '../../assets/logos/beaveride-logo.png';

export const EditorRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { activeRoom, setActiveRoom } = useRoomStore();

  const [activeFile, setActiveFile] = useState('main.js');
  const [files, setFiles] = useState<Record<string, string>>({
    'main.js': `import { serve } from '@beaveride/http';\nimport { logger } from './utils/logger.js';\n\nconst PORT = process.env.PORT || 3000;\n\nasync function initServer() {\n  try {\n    const server = await serve({ port: PORT });\n    logger.info(\`Server running successfully on port \${PORT}\`);\n    \n    // Initialize collaboration websocket\n    const wss = new WebSocketServer({ server });\n\n  } catch (err) {\n    logger.error('Failed to start server', err);\n    process.exit(1);\n  }\n}\n\ninitServer();`,
  });

  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;
      try {
        const room = await mockRoomService.getRoom(roomId);
        setActiveRoom(room);
      } catch (error) {
        console.error('Room not found', error);
        navigate('/dashboard');
      }
    };
    fetchRoom();
    
    return () => setActiveRoom(null);
  }, [roomId, navigate, setActiveRoom]);

  const handleRun = async () => {
    setStatus('running');
    setOutput('Starting execution environment...');
    
    try {
      const result = await mockEditorService.executeCode('javascript', files[activeFile] || '');
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

  const handleFileChange = (newVal: string | undefined) => {
    setFiles(prev => ({
      ...prev,
      [activeFile]: newVal || ''
    }));
  };

  const getLanguageType = (filename: string) => {
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.go')) return 'go';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.json')) return 'json';
    return 'markdown';
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.js')) {
      return <span className="material-symbols-outlined text-[16px] text-[#f0db4f]">javascript</span>;
    }
    if (filename.endsWith('.go')) {
      return <span className="material-symbols-outlined text-[16px] text-[#00add8]">code</span>;
    }
    if (filename.endsWith('.css')) {
      return <span className="material-symbols-outlined text-[16px] text-secondary">css</span>;
    }
    if (filename.endsWith('.json')) {
      return <span className="material-symbols-outlined text-[16px] text-[#cb3837]">settings</span>;
    }
    return <span className="material-symbols-outlined text-[16px] text-outline">description</span>;
  };

  if (!activeRoom) return <div className="p-8 text-center text-on-surface-variant font-body-md bg-surface h-screen flex items-center justify-center">Loading room...</div>;

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
                {Object.keys(files).filter(f => f === 'main.js' || f === 'server.go' || f === 'style.css').map((filename) => (
                  <div 
                    key={filename}
                    onClick={() => handleFileClick(filename)}
                    className={`flex items-center gap-xs px-sm py-xs rounded hover:bg-surface-container-high cursor-pointer text-on-surface font-label-md text-label-md ${activeFile === filename ? 'bg-surface-container-high' : ''}`}
                  >
                    {getFileIcon(filename)} {filename}
                  </div>
                ))}
              </div>
              
              {Object.keys(files).filter(f => f === 'README.md' || f === 'package.json').map((filename) => (
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
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
            <span className="font-label-md text-label-md">Profile</span>
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
              Connected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-sm">
            {/* Active Collaborators */}
            <div className="flex -space-x-2 mr-md">
              <div className="w-8 h-8 rounded-full border-2 border-tertiary bg-surface-container-high flex items-center justify-center relative cursor-pointer group">
                <span className="text-label-md font-bold text-on-surface-variant text-xs">A</span>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <div className="font-label-md text-label-md font-bold text-on-surface">Alex</div>
                  <div className="text-[12px] text-on-surface-variant">Viewing main.js</div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-secondary bg-surface-container-high flex items-center justify-center relative cursor-pointer group">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">smart_toy</span>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <div className="font-label-md text-label-md font-bold text-on-surface">BeaverBot</div>
                  <div className="text-[12px] text-on-surface-variant">Typing...</div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-error bg-surface-container-high flex items-center justify-center relative cursor-pointer group">
                <span className="text-label-md font-bold text-on-surface-variant text-xs">S</span>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <div className="font-label-md text-label-md font-bold text-on-surface">Sarah</div>
                  <div className="text-[12px] text-on-surface-variant">Idle</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => alert("Invite link copied! Invite others to join.")}
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
              onClick={handleRun} 
              disabled={status === 'running'}
              className="px-md py-sm rounded-lg bg-primary-container text-white font-label-md text-label-md hover:bg-primary transition-colors flex items-center gap-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span> Run
            </button>
          </div>
        </header>

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
              value={files[activeFile] || ''} 
              onChange={handleFileChange} 
            />

            {/* Presence Panel (Right side floating) */}
            <div className="absolute top-md right-md flex flex-col gap-sm z-30 w-64 select-none pointer-events-auto">
              <div className="glass-panel rounded-xl p-sm bg-white/80 backdrop-blur-md border border-outline-variant/30 shadow-md">
                <h3 className="font-label-md text-label-md font-bold text-on-surface mb-xs px-xs">Activity</h3>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-sm p-xs rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="w-6 h-6 rounded-full border-2 border-tertiary bg-surface-container-high flex items-center justify-center text-[10px] font-bold">A</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-label-md text-[12px] font-bold text-on-surface truncate">Alex</div>
                      <div className="text-[10px] text-on-surface-variant truncate">Refactoring initServer</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-sm p-xs rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="w-6 h-6 rounded-full border-2 border-secondary bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-label-md text-[12px] font-bold text-on-surface truncate">BeaverBot</div>
                      <div className="text-[10px] text-on-surface-variant truncate">Generating WebSocket boilerplate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal (Bottom Panel) */}
          <TerminalPanel output={output} />
        </div>
      </main>
    </div>
  );
};
