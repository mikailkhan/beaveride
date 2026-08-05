export type AgentTaskStatus =
  | 'assigned'
  | 'planning'
  | 'waiting'
  | 'writing'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AgentTask {
  id: number;
  taskId: string;
  roomId: number;
  assignedBy: number;
  agentUserId: number;
  targetFileId?: number | null;
  instruction: string;
  status: AgentTaskStatus;
  currentStage: string;
  planSummary?: string | null;
  generatedCode?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
}

export interface NewAgentTask {
  taskId?: string;
  roomId: number;
  assignedBy: number;
  agentUserId: number;
  targetFileId?: number | null;
  instruction: string;
  status?: AgentTaskStatus;
  currentStage?: string;
  planSummary?: string | null;
  generatedCode?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
}
