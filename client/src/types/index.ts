export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

export type RoomStatus = 'active' | 'archived' | 'trash' | 'deleted';

export interface Room {
  id: string;
  title: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  status: RoomStatus;
  role?: 'owner' | 'editor' | 'viewer';
  canRun?: boolean;
  members?: Array<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: 'owner' | 'editor' | 'viewer';
    canRun: boolean;
    joinedAt: string;
  }>;
}

export interface UserRoom {
  id: string;
  userId: string;
  roomId: string;
  role: 'owner' | 'editor' | 'viewer';
  canRun: boolean;
  joinedAt: string;
  updatedAt: string;
}

export type FileNodeType = 'file' | 'directory';

export interface ProjectFile {
  id: string;
  roomId: string;
  parentId: string | null;
  name: string;
  type: FileNodeType;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileTab {
  id: string;           // ProjectFile.id
  name: string;         // filename for display
  language: string;     // Monaco language id (e.g., 'javascript', 'python', 'go')
}

export type ActivityActorType = 'human' | 'agent' | 'system';

export type ActivityLockScope = 'file' | 'function';

export type ActivityOutcome =
  | 'granted'
  | 'denied'
  | 'queued'
  | 'expired'
  | 'revoked'
  | 'applied'
  | 'rejected'
  | 'promoted'
  | 'withdrawn'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ActivityReason =
  | 'overlap_conflict'
  | 'idle_timeout'
  | 'heartbeat_loss'
  | 'disconnect'
  | 'target_deleted'
  | 'stale_version'
  | 'out_of_scope'
  | 'execution_error'
  | 'cancelled_by_participant'
  | 'retry_exhausted'
  | 'unknown';

export type ActivityEventType =
  | 'lock_requested'
  | 'lock_granted'
  | 'lock_denied'
  | 'lock_queued'
  | 'lock_queue_position_changed'
  | 'lock_queue_withdrawn'
  | 'lock_queue_promoted'
  | 'lock_waiter_notified'
  | 'lock_released_explicit'
  | 'lock_released_idle_timeout'
  | 'lock_released_heartbeat_loss'
  | 'lock_released_disconnect'
  | 'lock_released_target_deleted'
  | 'write_applied'
  | 'write_rejected_stale'
  | 'write_regenerated'
  | 'write_refused_out_of_scope'
  | 'write_failed'
  | 'agent_task_assigned'
  | 'agent_task_accepted'
  | 'agent_stage_planning'
  | 'agent_stage_waiting'
  | 'agent_stage_writing'
  | 'agent_stage_verifying'
  | 'agent_task_completed'
  | 'agent_task_failed'
  | 'agent_task_cancelled'
  | 'participant_joined'
  | 'participant_left'
  | 'participant_disconnected'
  | 'participant_reconnected'
  | 'participant_heartbeat_lost'
  | 'file_opened_read'
  | 'file_opened_edit'
  | 'file_closed'
  | 'file_created'
  | 'file_renamed'
  | 'file_deleted'
  | 'code_edited'
  | 'global_run_started'
  | 'global_run_ended'
  | 'member_role_changed'
  | 'member_run_toggled'
  | 'member_kicked'
  // Legacy aliases
  | 'joined'
  | 'left'
  | 'global_run'
  | 'code_edit'
  | 'role_changed'
  | 'run_toggled'
  | 'kicked'
  | 'file_locked'
  | 'file_unlocked';

export interface ActivityEvent {
  id: number;
  eventId: string;
  roomId: number;
  seq: number;
  occurredAt: string;
  actorId: number | null;
  actorName: string;
  actorType: ActivityActorType;
  eventType: ActivityEventType;
  targetFileId?: number | null;
  targetScope?: ActivityLockScope | null;
  targetUnitName?: string | null;
  outcome?: ActivityOutcome | null;
  reason?: ActivityReason | null;
  correlationId?: string | null;
  versionRef?: string | null;
  versionProduced?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** @deprecated Use ActivityEvent instead */
export interface ActivityEntry {
  username: string;
  event: ActivityEventType;
  timestamp: string;
  targetUsername?: string;
  detail?: string;
}

export type LockScope = 'file' | 'function';

export interface LockSpan {
  fileId: number;
  startLine: number;
  endLine: number;
}

export interface FileLockInfo {
  id: string;
  fileId: number;
  userId: number;
  username: string;
  socketId: string;
  lockScope: LockScope;
  unitName?: string;
  startLine?: number;
  endLine?: number;
  includeUsages?: boolean;
  usageSpans?: LockSpan[];
  groupId?: string;
  acquiredAt: number;
  lastHeartbeat: number;
  contentHash?: string;
}

export interface QueueInfo {
  position: number;
  heldBy?: {
    userId: number;
    username: string;
    unitName?: string;
    lockScope?: LockScope;
    includeUsages?: boolean;
  };
}

export interface UsageScanResult {
  definitionFileId: number;
  unitName: string;
  usages: Array<{
    fileId: number;
    fileName: string;
    startLine: number;
    endLine: number;
    lineContent: string;
    confidence: 'high' | 'medium';
  }>;
  isComplete: boolean;
  warnings: string[];
}

