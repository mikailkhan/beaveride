import { create } from 'zustand';
import type { AgentTask } from '../types';

interface TaskState {
  activeTask: AgentTask | null;
  taskHistory: AgentTask[];
  setActiveTask: (task: AgentTask | null) => void;
  updateTaskStage: (taskId: string, stage: string, extra?: Partial<AgentTask>) => void;
  addToHistory: (task: AgentTask) => void;
  clearActiveTask: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  activeTask: null,
  taskHistory: [],

  setActiveTask: (task) => {
    set({ activeTask: task });
  },

  updateTaskStage: (taskId, stage, extra = {}) => {
    const { activeTask, taskHistory } = get();

    const isTerminal = ['completed', 'failed', 'cancelled'].includes(stage);

    if (activeTask && activeTask.taskId === taskId) {
      const updated: AgentTask = {
        ...activeTask,
        currentStage: stage,
        status: (extra.status || (isTerminal ? stage : activeTask.status)) as any,
        ...extra,
      };

      if (isTerminal) {
        // Move to history and clear active task
        const filteredHistory = taskHistory.filter((t) => t.taskId !== taskId);
        set({
          activeTask: updated, // keep activeTask populated briefly so UI displays terminal badge before auto-clear
          taskHistory: [updated, ...filteredHistory].slice(0, 20),
        });
      } else {
        set({ activeTask: updated });
      }
    } else {
      // Find in history if present
      const existingInHistory = taskHistory.find((t) => t.taskId === taskId);
      if (existingInHistory) {
        const updatedInHistory: AgentTask = {
          ...existingInHistory,
          currentStage: stage,
          status: (extra.status || (isTerminal ? stage : existingInHistory.status)) as any,
          ...extra,
        };
        const updatedHistory = taskHistory.map((t) => (t.taskId === taskId ? updatedInHistory : t));
        set({ taskHistory: updatedHistory });
      }
    }
  },

  addToHistory: (task) => {
    set((state) => {
      const filtered = state.taskHistory.filter((t) => t.taskId !== task.taskId);
      return { taskHistory: [task, ...filtered].slice(0, 20) };
    });
  },

  clearActiveTask: () => {
    set({ activeTask: null });
  },
}));
