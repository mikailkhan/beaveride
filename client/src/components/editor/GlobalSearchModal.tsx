import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Y from 'yjs';
import { useFileStore } from '../../store/fileStore';
import type { ProjectFile } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: Y.Doc | null;
  editor: any;
}

interface SearchMatch {
  lineNumber: number;
  prefix: string;
  matchText: string;
  suffix: string;
  fullLine: string;
}

interface FileSearchResult {
  file: ProjectFile;
  matches: SearchMatch[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  doc,
  editor,
}) => {
  const { files, openFile } = useFileStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getFileContent = (file: ProjectFile): string => {
    if (doc) {
      const filesMap = doc.getMap('files');
      const key = `file:${file.id}`;
      const yText = filesMap.get(key) as Y.Text | undefined;
      if (yText) {
        return yText.toString();
      }
    }
    return file.content || '';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
        return <span className="material-symbols-outlined text-[18px] text-[#f0db4f]">javascript</span>;
      case 'py':
        return <span className="material-symbols-outlined text-[18px] text-[#3572A5]">code</span>;
      case 'go':
        return <span className="material-symbols-outlined text-[18px] text-[#00add8]">code</span>;
      case 'css':
        return <span className="material-symbols-outlined text-[18px] text-[#2965f1]">css</span>;
      case 'json':
        return <span className="material-symbols-outlined text-[18px] text-[#e5a000]">data_object</span>;
      default:
        return <span className="material-symbols-outlined text-[18px] text-outline">description</span>;
    }
  };

  // Perform search across all project files
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const projectFileNodes = files.filter((f) => f.type === 'file');
    const results: FileSearchResult[] = [];

    for (const file of projectFileNodes) {
      const content = getFileContent(file);
      const lines = content.split('\n');
      const fileMatches: SearchMatch[] = [];

      lines.forEach((lineText, idx) => {
        const lowerLine = lineText.toLowerCase();
        let startIndex = 0;

        while (true) {
          const matchIdx = lowerLine.indexOf(trimmed, startIndex);
          if (matchIdx === -1) break;

          const matchLength = trimmed.length;
          const preCut = Math.max(0, matchIdx - 25);
          const postCut = Math.min(lineText.length, matchIdx + matchLength + 30);

          const prefix = (preCut > 0 ? '...' : '') + lineText.slice(preCut, matchIdx);
          const matchText = lineText.slice(matchIdx, matchIdx + matchLength);
          const suffix = lineText.slice(matchIdx + matchLength, postCut) + (postCut < lineText.length ? '...' : '');

          fileMatches.push({
            lineNumber: idx + 1,
            prefix,
            matchText,
            suffix,
            fullLine: lineText,
          });

          startIndex = matchIdx + Math.max(1, matchLength);
        }
      });

      if (fileMatches.length > 0 || file.name.toLowerCase().includes(trimmed)) {
        results.push({
          file,
          matches: fileMatches,
        });
      }
    }

    return results;
  }, [query, files, doc]);

  const handleSelectMatch = (file: ProjectFile, lineNumber?: number) => {
    openFile(file);
    onClose();

    if (editor && lineNumber) {
      setTimeout(() => {
        try {
          editor.revealLineInCenter(lineNumber);
          editor.setPosition({ lineNumber, column: 1 });
          editor.focus();
        } catch (err) {
          console.error('Failed to navigate editor to line:', err);
        }
      }, 100);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in p-4">
      {/* Search Modal Dialog Box */}
      <div 
        className="w-[640px] max-w-[90vw] h-[480px] bg-white rounded-2xl border border-[#e8e8ed] shadow-2xl flex flex-col overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e8e8ed] bg-[#f5f5f7]/50">
          <span className="material-symbols-outlined text-primary text-xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code or filenames across workspace..."
            className="flex-1 bg-transparent border-none text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#86868b] hover:text-[#1d1d1f] rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
              title="Clear search"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-[#86868b] bg-white border border-[#e8e8ed] rounded-md shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Search Results Content Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
          {!query.trim() ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-[#86868b] gap-2 py-12">
              <span className="material-symbols-outlined text-3xl opacity-60">search</span>
              <p className="text-sm font-medium text-[#1d1d1f]">Search Project Workspace</p>
              <p className="text-xs text-[#86868b] max-w-3xl">
                Type keywords to find matching code snippets or file names in real-time.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-[#86868b] gap-2 py-12">
              <span className="material-symbols-outlined text-3xl opacity-60">search_off</span>
              <p className="text-sm font-medium text-[#1d1d1f]">No results found</p>
              <p className="text-xs text-[#86868b]">
                No files or code instances matching "{query}"
              </p>
            </div>
          ) : (
            searchResults.map(({ file, matches }) => (
              <div
                key={file.id}
                className="bg-white rounded-xl border border-[#e8e8ed] overflow-hidden shadow-xs"
              >
                {/* File Header */}
                <div
                  onClick={() => handleSelectMatch(file)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#f5f5f7] border-b border-[#e8e8ed] cursor-pointer hover:bg-primary-container/10 transition-colors"
                >
                  {getFileIcon(file.name)}
                  <span className="font-semibold text-[#1d1d1f] text-xs">{file.name}</span>
                  <span className="text-[10px] text-[#86868b] ml-auto font-mono">
                    {matches.length} match{matches.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                {/* Match Instances */}
                <div className="divide-y divide-[#f5f5f7]">
                  {matches.length > 0 ? (
                    matches.map((m, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectMatch(file, m.lineNumber)}
                        className="flex items-start gap-3 px-3 py-2 hover:bg-[#f5f5f7]/80 cursor-pointer transition-colors group font-mono text-[11px]"
                      >
                        <span className="text-[#86868b] group-hover:text-primary transition-colors shrink-0 select-none">
                          Line {m.lineNumber}
                        </span>
                        <div className="flex-1 truncate text-[#1d1d1f]">
                          <span>{m.prefix}</span>
                          <mark className="bg-primary/20 text-primary font-bold rounded px-1 py-0.5">
                            {m.matchText}
                          </mark>
                          <span>{m.suffix}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      onClick={() => handleSelectMatch(file)}
                      className="px-3 py-2 text-[11px] text-[#86868b] italic cursor-pointer hover:bg-[#f5f5f7]"
                    >
                      Filename match
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
