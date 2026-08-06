import React, { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { useTaskStore } from '../../store/taskStore';

interface AgentTaskPanelProps {
  socket: Socket | null;
}

const STAGES = [
  { id: 'planning', label: 'Planning' },
  { id: 'waiting', label: 'Waiting for Lock' },
  { id: 'writing', label: 'Writing Code' },
  { id: 'verifying', label: 'Verifying' },
  { id: 'completed', label: 'Done' },
];

export const AgentTaskPanel: React.FC<AgentTaskPanelProps> = ({ socket }) => {
  const activeTask = useTaskStore((state) => state.activeTask);
  const taskHistory = useTaskStore((state) => state.taskHistory);
  const clearActiveTask = useTaskStore((state) => state.clearActiveTask);

  const [isExpanded, setIsExpanded] = useState(true);

  const currentTask = activeTask || (taskHistory.length > 0 ? taskHistory[0] : null);

  // Auto dismiss or collapse terminal tasks after 6 seconds
  useEffect(() => {
    if (!activeTask) return;
    const stage = activeTask.currentStage;
    if (['completed', 'failed', 'cancelled'].includes(stage)) {
      const timer = setTimeout(() => {
        clearActiveTask();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeTask, clearActiveTask]);

  if (!currentTask && !activeTask) {
    return null;
  }

  const task = currentTask!;
  const currentStage = task.currentStage;
  const isTerminal = ['completed', 'failed', 'cancelled'].includes(currentStage);

  const getStageIndex = (stage: string) => {
    switch (stage) {
      case 'assigned':
      case 'planning':
        return 0;
      case 'waiting':
        return 1;
      case 'writing':
        return 2;
      case 'verifying':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const activeIndex = getStageIndex(currentStage);

  const handleCancel = () => {
    if (socket && !isTerminal) {
      socket.emit('agent:task_cancel');
    }
  };

  return (
    <div className="w-full bg-neutral-950/70 backdrop-blur-xl border-b border-indigo-500/20 px-4 py-2.5 transition-all duration-300 select-none shadow-lg shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center text-xs shrink-0 font-mono shadow-sm">
            🤖
          </div>
          <span className="font-bold text-xs text-neutral-200 shrink-0">BeaverBot Task:</span>
          <span className="text-xs text-neutral-300 font-medium truncate max-w-[260px]" title={task.instruction}>
            "{task.instruction}"
          </span>

          {/* Target File Badge */}
          {((task.metadata as any)?.targetFileName || (task as any).targetFileName) && (
            <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-mono shrink-0">
              📄 {(task.metadata as any)?.targetFileName || (task as any).targetFileName}
            </span>
          )}

          {/* Status Badge */}
          {currentStage === 'completed' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[12px]">check_circle</span> Verified & Done
            </span>
          )}
          {currentStage === 'failed' && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[12px]">cancel</span> Failed
            </span>
          )}
          {currentStage === 'cancelled' && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[12px]">block</span> Cancelled
            </span>
          )}
          {!isTerminal && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-semibold flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              {currentStage.toUpperCase()}
            </span>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!isTerminal && (
            <button
              onClick={handleCancel}
              className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Cancel BeaverBot Task"
            >
              <span className="material-symbols-outlined text-[13px]">close</span> Cancel Task
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Task Details' : 'Expand Task Details'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {/* Expanded Stepper & Details */}
      {isExpanded && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1">
          {/* Stepper Dots */}
          <div className="flex items-center justify-between relative px-4 py-1">
            {STAGES.map((s, idx) => {
              const isCompleted = idx < activeIndex || currentStage === 'completed';
              const isActive = idx === activeIndex && !isTerminal;
              const isFailed = (currentStage === 'failed' || currentStage === 'cancelled') && idx === activeIndex;

              return (
                <div key={s.id} className="flex flex-col items-center z-10 relative group">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : isFailed
                        ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                        : isActive
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                        : 'bg-neutral-800 text-neutral-500 border border-white/10'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium transition-colors ${
                      isActive ? 'text-indigo-300 font-bold' : isCompleted ? 'text-emerald-400' : 'text-neutral-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Plan Summary / Generated Code / Error Detail */}
          {task.planSummary && (
            <div className="px-3 py-2 rounded-lg bg-neutral-900/90 border border-indigo-500/20 text-neutral-300 text-[11px] flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-indigo-400 shrink-0 mt-0.5">psychology</span>
              <div>
                <span className="font-bold text-indigo-300 block mb-0.5">Plan Summary:</span>
                <span className="text-neutral-300">{task.planSummary}</span>
              </div>
            </div>
          )}

          {task.generatedCode && (
            <div className="px-3 py-2 rounded-lg bg-neutral-900/90 border border-emerald-500/20 text-neutral-300 text-[11px] flex flex-col gap-1 font-mono">
              <span className="font-bold text-emerald-400 font-sans text-[11px]">Generated Code Snippet:</span>
              <pre className="text-[10px] text-emerald-200/90 overflow-x-auto p-1.5 bg-neutral-950 rounded border border-white/5 max-h-[80px]">
                {task.generatedCode.split('\n').slice(0, 5).join('\n')}
              </pre>
            </div>
          )}

          {task.failureReason && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-red-400 shrink-0">error</span>
              <span>{task.failureReason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
