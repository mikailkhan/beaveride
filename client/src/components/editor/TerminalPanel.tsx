import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

interface TerminalPanelProps {
  output: string;
  activeTab: 'global' | 'local';
  onTabChange: (tab: 'global' | 'local') => void;
}

export const TerminalPanel = ({ output, activeTab, onTabChange }: TerminalPanelProps) => {
  const globalTerminalRef = useRef<HTMLDivElement>(null);
  const xtermGlobalRef = useRef<Terminal | null>(null);
  const fitGlobalRef = useRef<FitAddon | null>(null);

  const localTerminalRef = useRef<HTMLDivElement>(null);
  const xtermLocalRef = useRef<Terminal | null>(null);
  const fitLocalRef = useRef<FitAddon | null>(null);
  
  // Height state and dragging refs
  const [height, setHeight] = useState(200);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!globalTerminalRef.current || !localTerminalRef.current) return;

    const setupTerminal = (
      container: HTMLDivElement,
      welcomeMsg: string,
      xtermRef: React.MutableRefObject<Terminal | null>,
      fitRef: React.MutableRefObject<FitAddon | null>
    ) => {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
        theme: {
          background: '#0D0D0D',
          foreground: '#CCCCCC',
          cursor: '#f66317',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
        },
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(container);
      try {
        fitAddon.fit();
      } catch (e) {
        // Safe to ignore if container is not fully rendered
      }

      xtermRef.current = term;
      fitRef.current = fitAddon;

      // Print starting command output
      term.writeln(welcomeMsg);
      term.write('\x1b[32m➜\x1b[0m \x1b[36mworkspace\x1b[0m ');

      // Input command line buffer
      let currentLine = '';

      const prompt = () => {
        term.write('\r\n\x1b[32m➜\x1b[0m \x1b[36mworkspace\x1b[0m ');
      };

      term.onKey(({ key, domEvent }) => {
        const char = key;
        if (domEvent.keyCode === 13) { // Enter
          term.writeln('');
          const trimmedCommand = currentLine.trim();
          if (trimmedCommand === 'clear') {
            term.clear();
          } else if (trimmedCommand === 'help') {
            term.writeln('Available commands: help, clear');
          } else if (trimmedCommand !== '') {
            term.writeln(`bash: command not found: ${trimmedCommand}`);
          }
          currentLine = '';
          prompt();
        } else if (domEvent.keyCode === 8) { // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
        } else if (domEvent.keyCode >= 37 && domEvent.keyCode <= 40) {
          // Disable arrow keys
        } else {
          currentLine += char;
          term.write(char);
        }
      });
    };

    // Initialize both terminals
    setupTerminal(
      globalTerminalRef.current,
      'BeaverIDE Global Execution Console — Output is shared with all room members.',
      xtermGlobalRef,
      fitGlobalRef
    );

    setupTerminal(
      localTerminalRef.current,
      'BeaverIDE Local Execution Console — Output is private to you.',
      xtermLocalRef,
      fitLocalRef
    );

    // Schedule a deferred fit once the DOM layout settles
    const initialFitTimeout = setTimeout(() => {
      try {
        fitGlobalRef.current?.fit();
        fitLocalRef.current?.fit();
      } catch (e) {}
    }, 50);

    const handleResize = () => {
      try {
        fitGlobalRef.current?.fit();
        fitLocalRef.current?.fit();
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialFitTimeout);
      xtermGlobalRef.current?.dispose();
      xtermLocalRef.current?.dispose();
    };
  }, []);

  // Update output dynamically if standard print events trigger (routes to global terminal in Step 2)
  useEffect(() => {
    if (xtermGlobalRef.current && output) {
      xtermGlobalRef.current.writeln('');
      xtermGlobalRef.current.writeln(output);
      xtermGlobalRef.current.write('\r\n\x1b[32m➜\x1b[0m \x1b[36mworkspace\x1b[0m ');
    }
  }, [output]);

  // Fit terminal when activeTab changes
  useEffect(() => {
    const fitRef = activeTab === 'global' ? fitGlobalRef : fitLocalRef;
    if (fitRef.current) {
      try {
        fitRef.current.fit();
      } catch (e) {}
    }
  }, [activeTab]);

  // Fit active terminal when panel height changes or expand/collapse occurs
  useEffect(() => {
    const fitRef = activeTab === 'global' ? fitGlobalRef : fitLocalRef;
    if (fitRef.current && !isCollapsed) {
      try {
        fitRef.current.fit();
      } catch (e) {}
    }
  }, [height, isCollapsed, activeTab]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const newHeight = window.innerHeight - e.clientY;
    // Constraints: minimum 100px, maximum 80% of window height
    if (newHeight >= 100 && newHeight <= window.innerHeight * 0.8) {
      setHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      className="relative bg-[#0D0D0D] border-t border-outline-variant/20 shrink-0 flex flex-col font-code-md text-code-md"
      style={{ height: isCollapsed ? '36px' : `${height}px` }}
    >
      {/* Resizing Drag Handle */}
      {!isCollapsed && (
        <div 
          onMouseDown={handleMouseDown}
          className="absolute top-0 left-0 right-0 h-[6px] -mt-[3px] cursor-ns-resize z-40 hover:bg-primary/50 transition-colors"
        />
      )}

      {/* Terminal Tabs */}
      <div className="flex items-center gap-md px-md py-xs bg-[#1A1A1A] border-b border-[#333] shrink-0 select-none">
        <button 
          onClick={() => onTabChange('global')}
          className={`${activeTab === 'global' ? 'text-white font-bold border-b-2 border-primary' : 'text-[#888] hover:text-white'} pb-1 cursor-pointer text-[13px] bg-transparent border-0 outline-none`}
        >
          Terminal
        </button>
        <button 
          onClick={() => onTabChange('local')}
          className={`${activeTab === 'local' ? 'text-white font-bold border-b-2 border-primary' : 'text-[#888] hover:text-white'} pb-1 cursor-pointer text-[13px] bg-transparent border-0 outline-none`}
        >
          Local Terminal
        </button>
        <div className="ml-auto flex gap-sm text-[#888]">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="material-symbols-outlined text-[16px] hover:text-white cursor-pointer transition-transform duration-200"
            title={isCollapsed ? "Expand Terminal" : "Collapse Terminal"}
          >
            {isCollapsed ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </button>
        </div>
      </div>
      {/* Terminal Output - Global */}
      <div className={`flex-1 min-h-0 relative p-sm bg-[#0D0D0D] ${(isCollapsed || activeTab !== 'global') ? 'hidden' : ''}`}>
        <div ref={globalTerminalRef} className="absolute inset-2 overflow-hidden" />
      </div>
      {/* Terminal Output - Local */}
      <div className={`flex-1 min-h-0 relative p-sm bg-[#0D0D0D] ${(isCollapsed || activeTab !== 'local') ? 'hidden' : ''}`}>
        <div ref={localTerminalRef} className="absolute inset-2 overflow-hidden" />
      </div>
    </div>
  );
};

export default TerminalPanel;
