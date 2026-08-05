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
  | 'single_scope_limit'
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
  // Lock requests
  | 'lock_requested'
  | 'lock_granted'
  | 'lock_denied'
  // Queueing
  | 'lock_queued'
  | 'lock_queue_position_changed'
  | 'lock_queue_withdrawn'
  | 'lock_queue_promoted'
  | 'lock_waiter_notified'
  // Lock release
  | 'lock_released_explicit'
  | 'lock_released_idle_timeout'
  | 'lock_released_heartbeat_loss'
  | 'lock_released_disconnect'
  | 'lock_released_target_deleted'
  // Writes
  | 'write_applied'
  | 'write_rejected_stale'
  | 'write_regenerated'
  | 'write_refused_out_of_scope'
  | 'write_failed'
  // Agent tasks
  | 'agent_task_assigned'
  | 'agent_task_accepted'
  | 'agent_stage_planning'
  | 'agent_stage_waiting'
  | 'agent_stage_writing'
  | 'agent_stage_verifying'
  | 'agent_task_completed'
  | 'agent_task_failed'
  | 'agent_task_cancelled'
  // Participants
  | 'participant_joined'
  | 'participant_left'
  | 'participant_disconnected'
  | 'participant_reconnected'
  | 'participant_heartbeat_lost'
  // Files
  | 'file_opened_read'
  | 'file_opened_edit'
  | 'file_closed'
  | 'file_created'
  | 'file_renamed'
  | 'file_deleted'
  // Legacy v1 events
  | 'code_edited'
  | 'global_run_started'
  | 'global_run_ended'
  | 'member_role_changed'
  | 'member_run_toggled'
  | 'member_kicked';

export interface ActivityEvent {
  id: number;
  eventId: string;
  roomId: number;
  seq: number;
  occurredAt: string;
  actorId?: number | null | undefined;
  actorName: string;
  actorType: ActivityActorType;
  eventType: ActivityEventType;
  targetFileId?: number | null | undefined;
  targetScope?: ActivityLockScope | null | undefined;
  targetUnitName?: string | null | undefined;
  outcome?: ActivityOutcome | null | undefined;
  reason?: ActivityReason | null | undefined;
  correlationId?: string | null | undefined;
  versionRef?: string | null | undefined;
  versionProduced?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
}

export interface NewActivityEvent {
  eventId?: string | null | undefined;
  roomId: number;
  actorId?: number | null | undefined;
  actorName: string;
  actorType?: ActivityActorType | undefined;
  eventType: ActivityEventType;
  targetFileId?: number | null | undefined;
  targetScope?: ActivityLockScope | null | undefined;
  targetUnitName?: string | null | undefined;
  outcome?: ActivityOutcome | null | undefined;
  reason?: ActivityReason | null | undefined;
  correlationId?: string | null | undefined;
  versionRef?: string | null | undefined;
  versionProduced?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
}
