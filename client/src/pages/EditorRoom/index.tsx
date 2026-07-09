import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonacoEditor } from '../../components/editor/MonacoEditor';
import { TerminalPanel } from '../../components/editor/TerminalPanel';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { useRoomStore } from '../../store/roomStore';
import { mockRoomService } from '../../services/mocks/mockRoomService';
import { mockEditorService } from '../../services/mocks/mockEditorService';
import { Play } from 'lucide-react';

export const EditorRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { activeRoom, setActiveRoom } = useRoomStore();
  
  const [code, setCode] = useState('// Welcome to BeaverIDE\nconsole.log("Hello, World!");');
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
      const result = await mockEditorService.executeCode('javascript', code);
      setOutput(result);
      setStatus('success');
    } catch (error) {
      setOutput((error as Error).message);
      setStatus('error');
    }
  };

  if (!activeRoom) return <div className="p-8 text-center">Loading room...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-surface">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/50 bg-surface">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-on-surface">{activeRoom.title}</h2>
            <span className="text-xs font-medium px-2 py-1 bg-surface-container rounded-md text-on-surface-variant">
              JavaScript
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mock Collaborative Presence */}
            <div className="flex -space-x-2">
              <Avatar name="Alice Smith" color="#F66317" size="sm" className="ring-2 ring-surface" />
              <Avatar name="Bob Jones" color="#286867" size="sm" className="ring-2 ring-surface" />
              <Avatar name="Current User" color="#2c59bc" size="sm" className="ring-2 ring-surface" />
            </div>
            
            <Button size="sm" onClick={handleRun} disabled={status === 'running'} className="gap-2 w-24">
              <Play size={16} fill={status === 'running' ? "transparent" : "currentColor"} />
              {status === 'running' ? 'Running' : 'Run'}
            </Button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 relative min-h-0">
            <MonacoEditor 
              language="javascript" 
              value={code} 
              onChange={(val) => setCode(val || '')} 
            />
          </div>
          <TerminalPanel output={output} status={status} />
        </div>
    </div>
  );
};
