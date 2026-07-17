import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

interface TerminalPanelProps {
  output: string;
}

export const TerminalPanel = ({ output }: TerminalPanelProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
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
    term.open(terminalRef.current);
    try {
      fitAddon.fit();
    } catch (e) {
      console.warn('Initial xterm fit failed, retrying on next frame:', e);
    }
    
    // Schedule a deferred fit once the DOM layout settles
    const initialFitTimeout = setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Safe to ignore if container is still not fully rendered/visible
      }
    }, 50);

    // Store references
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Print starting command output
    term.writeln('BeaverIDE Code Execution Console active.');
    term.writeln('Write code in the editor and click the "Run" button in the header to execute.');
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

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialFitTimeout);
      term.dispose();
    };
  }, []);

  // Update output dynamically if standard print events trigger
  useEffect(() => {
    if (xtermRef.current && output) {
      xtermRef.current.writeln('');
      xtermRef.current.writeln(output);
      xtermRef.current.write('\r\n\x1b[32m➜\x1b[0m \x1b[36mworkspace\x1b[0m ');
    }
  }, [output]);

  return (
    <div className="h-[200px] bg-[#0D0D0D] border-t border-outline-variant/20 shrink-0 flex flex-col font-code-md text-code-md">
      {/* Terminal Tabs */}
      <div className="flex items-center gap-md px-md py-xs bg-[#1A1A1A] border-b border-[#333] shrink-0 select-none">
        <div className="text-white font-bold border-b-2 border-primary pb-1 cursor-pointer text-[13px]">Terminal</div>
        <div className="text-[#888] hover:text-white cursor-pointer pb-1 text-[13px]">Output</div>
        <div className="text-[#888] hover:text-white cursor-pointer pb-1 text-[13px]">
          Problems <span className="bg-[#333] px-1.5 py-0.5 rounded-full text-[10px] ml-1">0</span>
        </div>
        <div className="ml-auto flex gap-sm text-[#888]">
          <span className="material-symbols-outlined text-[16px] hover:text-white cursor-pointer">add</span>
          <span className="material-symbols-outlined text-[16px] hover:text-white cursor-pointer">delete</span>
          <span className="material-symbols-outlined text-[16px] hover:text-white cursor-pointer">keyboard_arrow_up</span>
          <span className="material-symbols-outlined text-[16px] hover:text-white cursor-pointer">close</span>
        </div>
      </div>
      {/* Terminal Output */}
      <div className="flex-1 min-h-0 relative p-sm bg-[#0D0D0D]">
        <div ref={terminalRef} className="absolute inset-2 overflow-hidden" />
      </div>
    </div>
  );
};
export default TerminalPanel;
