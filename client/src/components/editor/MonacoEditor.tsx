import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useLockStore } from '../../store/lockStore';
import { useAuthStore } from '../../store/authStore';
import { useFileStore } from '../../store/fileStore';

interface MonacoEditorProps {
  fileId?: number;
  language: string;
  value?: string;
  options?: Record<string, any>;
  onChange?: (value: string | undefined) => void;
  onMount?: OnMount;
  readOnly?: boolean;
  onRequestUsageLock?: (data: {
    fileId: number;
    unitName: string;
    startLine: number;
    endLine: number;
  }) => void;
}

function getIndentLevel(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') count++;
    else if (text[i] === '\t') count += 4;
    else break;
  }
  return count;
}

function findPythonIndentedBlock(model: monaco.editor.ITextModel, lineNumber: number): { startLine: number; endLine: number } | null {
  let startLine = lineNumber;
  let headerLine = -1;

  while (startLine > 0) {
    const text = model.getLineContent(startLine).split('#')[0].trimEnd();
    if (text.endsWith(':')) {
      headerLine = startLine;
      break;
    }
    startLine--;
  }

  if (headerLine === -1) return null;

  const baseIndent = getIndentLevel(model.getLineContent(headerLine));
  const lineCount = model.getLineCount();
  let lastBlockLine = headerLine;

  for (let l = headerLine + 1; l <= lineCount; l++) {
    const rawText = model.getLineContent(l);
    const trimmed = rawText.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      lastBlockLine = l;
      continue;
    }

    const currentIndent = getIndentLevel(rawText);
    if (currentIndent > baseIndent) {
      lastBlockLine = l;
    } else {
      break;
    }
  }

  while (lastBlockLine > headerLine && model.getLineContent(lastBlockLine).trim() === '') {
    lastBlockLine--;
  }

  return { startLine: headerLine, endLine: lastBlockLine };
}

function findCurlyBraceBlock(model: monaco.editor.ITextModel, lineNumber: number): { startLine: number; endLine: number } | null {
  let startLine = lineNumber;
  let foundOpen = false;
  let openIndex = -1;
  
  while (startLine > 0) {
    const lineContent = model.getLineContent(startLine);
    openIndex = lineContent.lastIndexOf('{');
    if (openIndex !== -1) {
      foundOpen = true;
      break;
    }
    startLine--;
  }

  if (!foundOpen) return null;

  let braceCount = 0;
  for (let l = startLine; l <= model.getLineCount(); l++) {
    const text = model.getLineContent(l);
    let i = (l === startLine) ? openIndex : 0;
    for (; i < text.length; i++) {
      if (text[i] === '{') braceCount++;
      else if (text[i] === '}') braceCount--;

      if (braceCount === 0) {
        return { startLine, endLine: l };
      }
    }
  }

  return null;
}

import { parseCodeUnits } from '../../utils/codeParser';

function findBlock(editor: monaco.editor.ICodeEditor, language: string): { startLine: number; endLine: number; unitName?: string } | null {
  const model = editor.getModel();
  if (!model) return null;

  const position = editor.getPosition();
  const lineNumber = position?.lineNumber ?? 1;

  // 1. Match against parsed code units (functions/classes/methods)
  const codeUnits = parseCodeUnits(model.getValue(), language);
  const matchedUnit = codeUnits.find(u => lineNumber >= u.startLine && lineNumber <= u.endLine);

  if (matchedUnit) {
    return {
      startLine: matchedUnit.startLine,
      endLine: matchedUnit.endLine,
      unitName: matchedUnit.unitName,
    };
  }

  // 2. Selection fallback
  const selection = editor.getSelection();
  if (selection && selection.startLineNumber !== selection.endLineNumber) {
    return {
      startLine: Math.min(selection.startLineNumber, selection.endLineNumber),
      endLine: Math.max(selection.startLineNumber, selection.endLineNumber),
    };
  }

  // 3. Language brace/indentation fallback
  const lang = language.toLowerCase();
  if (lang === 'python' || lang === 'yaml' || lang === 'yml') {
    const pythonBlock = findPythonIndentedBlock(model, lineNumber);
    if (pythonBlock) return pythonBlock;
  }

  const braceBlock = findCurlyBraceBlock(model, lineNumber);
  if (braceBlock) return braceBlock;

  return { startLine: lineNumber, endLine: lineNumber };
}

const EMPTY_ARRAY: any[] = [];

export const MonacoEditor = ({ fileId, language, value, options, onChange, onMount, readOnly, onRequestUsageLock }: MonacoEditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const decorationsCollection = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  
  const [dynamicReadOnly, setDynamicReadOnly] = useState(false);
  const [dynamicReadOnlyReason, setDynamicReadOnlyReason] = useState<{ type: 'collaborator' | 'out_of_scope'; unitName?: string } | null>(null);

  const fileIdRef = useRef(fileId);
  useEffect(() => {
    fileIdRef.current = fileId;
  }, [fileId]);

  const authUser = useAuthStore(state => state.user);
  const socket = useFileStore(state => state.socket);
  const fileLocks = useLockStore(state => fileId ? state.fileLocks.get(fileId) : undefined) || EMPTY_ARRAY;
  
  // Track double click timing for releasing locks via gutter
  const lastClickTimeRef = useRef<{ time: number; line: number }>({ time: 0, line: 0 });

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
    decorationsCollection.current = editor.createDecorationsCollection();

    // Register Context Key for Block Lock status under cursor
    const isBlockLockedKey = editor.createContextKey<boolean>('isCurrentBlockLockedByMe', false);

    const updateBlockLockedKey = () => {
      const position = editor.getPosition();
      const currentFileId = fileIdRef.current;
      const currentUser = useAuthStore.getState().user;

      if (!position || !currentFileId || !currentUser) {
        isBlockLockedKey.set(false);
        return;
      }

      const currentLocks = useLockStore.getState().getLocks(currentFileId);
      const myLock = currentLocks.find(l => 
        String(l.userId) === String(currentUser.id) &&
        l.lockScope === 'function' &&
        l.startLine !== undefined &&
        l.endLine !== undefined &&
        position.lineNumber >= l.startLine && position.lineNumber <= l.endLine
      );

      isBlockLockedKey.set(!!myLock);
    };

    editor.onDidChangeCursorPosition(updateBlockLockedKey);
    editor.onContextMenu(updateBlockLockedKey);

    // Register Command for Cmd+Shift+L / Ctrl+Shift+L shortcut
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyL,
      () => {
        const currentFileId = fileIdRef.current;
        if (!currentFileId) return;
        const position = editor.getPosition();
        if (!position) return;
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const currentLocks = useLockStore.getState().getLocks(currentFileId);
        const myLock = currentLocks.find(l => 
          String(l.userId) === String(currentUser.id) &&
          l.lockScope === 'function' &&
          l.startLine !== undefined &&
          l.endLine !== undefined &&
          position.lineNumber >= l.startLine && position.lineNumber <= l.endLine
        );

        const sock = useFileStore.getState().socket;

        if (myLock) {
          if (myLock.groupId) {
            sock?.emit('lock:release-group', { groupId: myLock.groupId });
          } else {
            sock?.emit('lock:release', { fileId: currentFileId, lockId: myLock.id });
          }
        } else {
          const block = findBlock(editor, language);
          if (block) {
            const overlap = currentLocks.some(l => 
              l.lockScope === 'file' ||
              (l.startLine !== undefined && l.endLine !== undefined &&
              l.startLine <= block.endLine && l.endLine >= block.startLine)
            );

            if (!overlap) {
              sock?.emit('lock:acquire', { 
                fileId: currentFileId, 
                lockScope: 'function', 
                startLine: block.startLine, 
                endLine: block.endLine,
                unitName: block.unitName,
              });
            }
          }
        }
      }
    );

    // Register Context Menu Actions for Lock & Unlock Block Scope
    editor.addAction({
      id: 'lock-block-scope',
      label: 'Lock Block/Function Scope',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyL
      ],
      contextMenuGroupId: '1_modification',
      contextMenuOrder: 1,
      precondition: '!isCurrentBlockLockedByMe',
      run: (ed) => {
        const currentFileId = fileIdRef.current;
        if (!currentFileId) return;
        
        const block = findBlock(ed, language);
        if (block) {
          const currentLocks = useLockStore.getState().getLocks(currentFileId);
          const overlap = currentLocks.some(l => 
            l.lockScope === 'file' ||
            (l.startLine !== undefined && l.endLine !== undefined &&
            l.startLine <= block.endLine && l.endLine >= block.startLine)
          );

          if (!overlap) {
            const sock = useFileStore.getState().socket;
            sock?.emit('lock:acquire', { 
              fileId: currentFileId, 
              lockScope: 'function', 
              startLine: block.startLine, 
              endLine: block.endLine,
              unitName: block.unitName,
            });
          }
        }
      }
    });

    // Context menu action: Lock with Usages
    editor.addAction({
      id: 'lock-with-usages',
      label: 'Lock with Usages',
      contextMenuGroupId: '1_modification',
      contextMenuOrder: 2,
      run: (ed) => {
        const currentFileId = fileIdRef.current;
        if (!currentFileId) return;
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const block = findBlock(ed, language);
        if (block && block.unitName) {
          // Check if user already holds a definition-only lock on this block -> release first (widening)
          const currentLocks = useLockStore.getState().getLocks(currentFileId);
          const myExistingLock = currentLocks.find(l =>
            String(l.userId) === String(currentUser.id) &&
            l.lockScope === 'function' &&
            l.startLine !== undefined && l.endLine !== undefined &&
            block.startLine >= l.startLine && block.endLine <= l.endLine &&
            !l.includeUsages
          );

          if (myExistingLock) {
            const sock = useFileStore.getState().socket;
            if (myExistingLock.groupId) {
              sock?.emit('lock:release-group', { groupId: myExistingLock.groupId });
            } else {
              sock?.emit('lock:release', { fileId: currentFileId, lockId: myExistingLock.id });
            }
          }

          onRequestUsageLock?.({
            fileId: currentFileId,
            unitName: block.unitName,
            startLine: block.startLine,
            endLine: block.endLine,
          });
        }
      },
    });

    editor.addAction({
      id: 'unlock-block-scope',
      label: 'Unlock Block/Function Scope',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyL
      ],
      contextMenuGroupId: '1_modification',
      contextMenuOrder: 1,
      precondition: 'isCurrentBlockLockedByMe',
      run: (ed) => {
        const position = ed.getPosition();
        const currentFileId = fileIdRef.current;
        if (!position || !currentFileId) return;
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const currentLocks = useLockStore.getState().getLocks(currentFileId);
        const myLock = currentLocks.find(l => 
          String(l.userId) === String(currentUser.id) &&
          l.lockScope === 'function' &&
          l.startLine !== undefined &&
          l.endLine !== undefined &&
          position.lineNumber >= l.startLine && position.lineNumber <= l.endLine
        );

        if (myLock) {
          const sock = useFileStore.getState().socket;
          if (myLock.groupId) {
            sock?.emit('lock:release-group', { groupId: myLock.groupId });
          } else {
            sock?.emit('lock:release', { fileId: currentFileId, lockId: myLock.id });
          }
        }
      }
    });

    // Double-click on gutter lock icon to release
    editor.onMouseDown((e) => {
      const currentFileId = fileIdRef.current;
      if (readOnly || !currentFileId || !authUser) return;

      const target = e.target;
      const targetType = target.type;
      const TargetTypes = monacoInstance.editor.MouseTargetType;

      if (
        targetType === TargetTypes.GUTTER_LINE_NUMBERS ||
        targetType === TargetTypes.GUTTER_GLYPH_MARGIN ||
        targetType === TargetTypes.GUTTER_LINE_DECORATIONS
      ) {
        const lineNumber = target.position?.lineNumber;
        if (!lineNumber) return;

        const now = Date.now();
        const lastClick = lastClickTimeRef.current;
        const isDoubleClick = now - lastClick.time < 400 && lastClick.line === lineNumber;
        lastClickTimeRef.current = { time: now, line: lineNumber };

        const currentLocks = useLockStore.getState().getLocks(currentFileId);
        const myLock = currentLocks.find(l => 
          String(l.userId) === String(authUser.id) &&
          l.lockScope === 'function' &&
          l.startLine !== undefined &&
          l.endLine !== undefined &&
          lineNumber >= l.startLine && lineNumber <= l.endLine
        );

        if (isDoubleClick && myLock) {
          if (myLock.groupId) {
            socket?.emit('lock:release-group', { groupId: myLock.groupId });
          } else {
            socket?.emit('lock:release', { fileId: currentFileId, lockId: myLock.id });
          }
          e.event.preventDefault();
        }
      }
    });

    // Dynamically adjust and re-anchor lock line spans when lines are inserted/deleted
    editor.onDidChangeModelContent((e) => {
      const currentFileId = fileIdRef.current;
      const model = editor.getModel();
      if (!currentFileId || !model) return;

      const codeUnits = parseCodeUnits(model.getValue(), language);

      for (const change of e.changes) {
        const addedLines = (change.text.match(/\n/g) || []).length;
        const removedLines = change.range.endLineNumber - change.range.startLineNumber;
        const lineDelta = addedLines - removedLines;

        useLockStore.getState().reanchorLockSpans(
          currentFileId,
          codeUnits,
          change.range.startLineNumber,
          lineDelta
        );

        if (lineDelta !== 0) {
          const sock = useFileStore.getState().socket;
          sock?.emit('lock:span-shift', {
            fileId: currentFileId,
            editStartLine: change.range.startLineNumber,
            lineDelta,
          });
        }
      }
    });

    // Cursor overlap detection & out-of-scope edit prevention
    editor.onDidChangeCursorSelection(() => {
      const currentFileId = fileIdRef.current;
      if (readOnly || !authUser || !currentFileId) {
        setDynamicReadOnly(false);
        setDynamicReadOnlyReason(null);
        return;
      }

      const selections = editor.getSelections();
      const currentLocks = useLockStore.getState().getLocks(currentFileId);
      
      const myLock = currentLocks.find(l => 
        String(l.userId) === String(authUser.id) &&
        l.lockScope === 'function' &&
        l.startLine !== undefined &&
        l.endLine !== undefined
      );

      let isBlocked = false;
      let reason: { type: 'collaborator' | 'out_of_scope'; unitName?: string } | null = null;

      if (selections) {
        for (const sel of selections) {
          const start = sel.startLineNumber;
          const end = sel.endLineNumber;

          // Rule 1: If user holds a function lock, block any edit outside their locked scope [startLine, endLine]
          if (myLock && myLock.startLine !== undefined && myLock.endLine !== undefined) {
            if (start < myLock.startLine || end > myLock.endLine) {
              isBlocked = true;
              reason = { type: 'out_of_scope', unitName: myLock.unitName };
              break;
            }
          }

          // Rule 2: Block editing if selection overlaps a function lock owned by a collaborator
          const overlapCollaborator = currentLocks.some(l => 
            String(l.userId) !== String(authUser.id) &&
            l.lockScope === 'function' &&
            l.startLine !== undefined && l.endLine !== undefined &&
            start <= l.endLine && end >= l.startLine
          );

          if (overlapCollaborator) {
            isBlocked = true;
            reason = { type: 'collaborator' };
            break;
          }
        }
      }
      
      setDynamicReadOnly(isBlocked);
      setDynamicReadOnlyReason(isBlocked ? reason : null);
    });

    if (onMount) {
      onMount(editor, monacoInstance);
    }
  };

  // Update decorations when locks change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !decorationsCollection.current) return;
    
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];

    for (const lock of fileLocks) {
      if (lock.lockScope === 'function' && lock.startLine && lock.endLine) {
        const isMine = authUser && String(lock.userId) === String(authUser.id);
        const isUsageSpan = lock.unitName?.endsWith('(usage)');
        const displayName = isUsageSpan
          ? lock.unitName?.replace(' (usage)', '')
          : lock.unitName;
        const unitNameText = displayName ? ` (${displayName}${isUsageSpan ? ' — usage' : ''})` : '';
        const lineRangeText = `L${lock.startLine}-L${lock.endLine}`;
        
        newDecorations.push({
          range: new monacoRef.current.Range(lock.startLine, 1, lock.endLine, 1),
          options: {
            isWholeLine: true,
            className: isMine 
              ? (isUsageSpan ? 'block-lock-mine-usage' : 'block-lock-mine')
              : (isUsageSpan ? 'block-lock-other-usage' : 'block-lock-other'),
            glyphMarginClassName: isMine ? 'block-lock-icon-mine' : 'block-lock-icon-other',
            linesDecorationsClassName: isMine ? 'block-lock-icon-mine' : 'block-lock-icon-other',
            glyphMarginHoverMessage: { value: isMine ? `Locked by you${unitNameText} [${lineRangeText}]${isUsageSpan ? ' — usage span' : ''} - double-click to release` : `Locked by ${lock.username}${unitNameText} [${lineRangeText}]${isUsageSpan ? ' — usage span' : ''}` },
            hoverMessage: isMine ? undefined : { value: `Locked by ${lock.username}${unitNameText} [${lineRangeText}]` }
          }
        });
      }
    }

    decorationsCollection.current.set(newDecorations);
  }, [fileLocks, readOnly, authUser]);

  // Update editor readOnly options when props or dynamic state changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: readOnly || dynamicReadOnly });
    }
  }, [readOnly, dynamicReadOnly]);

  return (
    <div className="flex-1 w-full h-full relative flex flex-col">
      {readOnly && (
        <div className="flex items-center gap-xs px-sm py-1 bg-error/10 text-error text-xs font-label-md border-b border-error/20 shrink-0">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          This file is locked by another user. View only.
        </div>
      )}
      {dynamicReadOnly && !readOnly && (
        <div className="flex items-center gap-xs px-sm py-1 bg-amber-500/10 text-amber-600 text-xs font-label-md border-b border-amber-500/20 shrink-0">
          <span className="material-symbols-outlined text-[14px]">edit_off</span>
          {dynamicReadOnlyReason?.type === 'out_of_scope'
            ? `You hold a lock on ${dynamicReadOnlyReason.unitName ? `function "${dynamicReadOnlyReason.unitName}"` : 'a code unit'}. Edits outside your locked scope are disabled.`
            : 'Cursor is inside a block locked by another user. Read-only mode active.'}
        </div>
      )}
      <div className="flex-1 w-full relative">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={onChange}
          onMount={handleEditorMount}
          theme="light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: '"JetBrains Mono", monospace',
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            readOnly: readOnly || dynamicReadOnly,
            glyphMargin: true,
            ...options,
          }}
          loading={<div className="p-4 text-on-surface-variant">Loading editor...</div>}
        />
      </div>
    </div>
  );
};
