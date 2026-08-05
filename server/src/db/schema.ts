import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoomRoleEnum = pgEnum('user_room_role', ['owner', 'editor', 'viewer']);
export const runStatusEnum = pgEnum('run_status', ['queued', 'running', 'success', 'error', 'cancelled']);
export const fileNodeTypeEnum = pgEnum('file_node_type', ['file', 'directory']);
export const agentTaskStatusEnum = pgEnum('agent_task_status', [
  'assigned',
  'planning',
  'waiting',
  'writing',
  'verifying',
  'completed',
  'failed',
  'cancelled',
]);

export const activityActorTypeEnum = pgEnum('activity_actor_type', ['human', 'agent', 'system']);
export const activityLockScopeEnum = pgEnum('activity_lock_scope', ['file', 'function']);
export const activityOutcomeEnum = pgEnum('activity_outcome', [
  'granted',
  'denied',
  'queued',
  'expired',
  'revoked',
  'applied',
  'rejected',
  'promoted',
  'withdrawn',
  'completed',
  'failed',
  'cancelled',
]);
export const activityReasonEnum = pgEnum('activity_reason', [
  'overlap_conflict',
  'single_scope_limit',
  'idle_timeout',
  'heartbeat_loss',
  'disconnect',
  'target_deleted',
  'stale_version',
  'out_of_scope',
  'execution_error',
  'cancelled_by_participant',
  'retry_exhausted',
  'unknown',
]);
export const activityEventTypeEnum = pgEnum('activity_event_type', [
  // Lock requests
  'lock_requested',
  'lock_granted',
  'lock_denied',
  // Queueing
  'lock_queued',
  'lock_queue_position_changed',
  'lock_queue_withdrawn',
  'lock_queue_promoted',
  'lock_waiter_notified',
  // Lock release
  'lock_released_explicit',
  'lock_released_idle_timeout',
  'lock_released_heartbeat_loss',
  'lock_released_disconnect',
  'lock_released_target_deleted',
  // Writes
  'write_applied',
  'write_rejected_stale',
  'write_regenerated',
  'write_refused_out_of_scope',
  'write_failed',
  // Agent tasks
  'agent_task_assigned',
  'agent_task_accepted',
  'agent_stage_planning',
  'agent_stage_waiting',
  'agent_stage_writing',
  'agent_stage_verifying',
  'agent_task_completed',
  'agent_task_failed',
  'agent_task_cancelled',
  // Participants
  'participant_joined',
  'participant_left',
  'participant_disconnected',
  'participant_reconnected',
  'participant_heartbeat_lost',
  // Files
  'file_opened_read',
  'file_opened_edit',
  'file_closed',
  'file_created',
  'file_renamed',
  'file_deleted',
  // Legacy v1 events
  'code_edited',
  'global_run_started',
  'global_run_ended',
  'member_role_changed',
  'member_run_toggled',
  'member_kicked',
]);

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 120 }).notNull(),
    lastName: varchar('last_name', { length: 120 }).notNull(),
    username: varchar('username', { length: 80 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    isAgent: boolean('is_agent').default(false).notNull(),
    ...timestamps,
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    usernameIdx: uniqueIndex('users_username_idx').on(table.username),
  }),
);

export const programmingLanguages = pgTable(
  'programming_languages',
  {
    id: serial('id').primaryKey(),
    language: varchar('language', { length: 80 }).notNull(),
  },
  (table) => ({
    languageIdx: uniqueIndex('programming_languages_language_idx').on(table.language),
  }),
);

export const statuses = pgTable(
  'statuses',
  {
    id: serial('id').primaryKey(),
    state: varchar('state', { length: 40 }).notNull(),
  },
  (table) => ({
    stateIdx: uniqueIndex('statuses_state_idx').on(table.state),
  }),
);

export const rooms = pgTable(
  'rooms',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 160 }).notNull(),
    programmingLanguageId: integer('programming_language_id')
      .notNull()
      .references(() => programmingLanguages.id, { onDelete: 'restrict' }),
    statusId: integer('status_id')
      .notNull()
      .references(() => statuses.id, { onDelete: 'restrict' }),
    ...timestamps,
  },
  (table) => ({
    statusIdx: index('rooms_status_idx').on(table.statusId),
    languageIdx: index('rooms_language_idx').on(table.programmingLanguageId),
  }),
);

export const userRooms = pgTable(
  'user_rooms',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    role: userRoomRoleEnum('role').notNull(),
    canRun: boolean('can_run').notNull().default(false),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    membershipIdx: uniqueIndex('user_rooms_user_room_idx').on(table.userId, table.roomId),
    roomIdx: index('user_rooms_room_idx').on(table.roomId),
  }),
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roomCreatedIdx: index('chat_messages_room_created_idx').on(table.roomId, table.createdAt),
  }),
);

export const codeSnapshots = pgTable(
  'code_snapshots',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    snapshot: bytea('snapshot').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    roomCreatedIdx: index('code_snapshots_room_created_idx').on(table.roomId, table.createdAt),
  }),
);

export const runSnapshots = pgTable(
  'run_snapshots',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    status: runStatusEnum('status').notNull(),
  },
  (table) => ({
    roomStartedIdx: index('run_snapshots_room_started_idx').on(table.roomId, table.startedAt),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(userRooms),
  chatMessages: many(chatMessages),
  codeSnapshots: many(codeSnapshots),
  runSnapshots: many(runSnapshots),
  assignedAgentTasks: many(agentTasks, { relationName: 'assignedByTasks' }),
  agentUserTasks: many(agentTasks, { relationName: 'agentUserTasks' }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  programmingLanguage: one(programmingLanguages, {
    fields: [rooms.programmingLanguageId],
    references: [programmingLanguages.id],
  }),
  status: one(statuses, {
    fields: [rooms.statusId],
    references: [statuses.id],
  }),
  memberships: many(userRooms),
  chatMessages: many(chatMessages),
  codeSnapshots: many(codeSnapshots),
  runSnapshots: many(runSnapshots),
  projectFiles: many(projectFiles),
  activityEvents: many(activityEvents),
  agentTasks: many(agentTasks),
}));

export const userRoomsRelations = relations(userRooms, ({ one }) => ({
  user: one(users, {
    fields: [userRooms.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [userRooms.roomId],
    references: [rooms.id],
  }),
}));

export const projectFiles = pgTable(
  'project_files',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    parentId: integer('parent_id'),   // null = root level
    name: varchar('name', { length: 255 }).notNull(),
    type: fileNodeTypeEnum('type').notNull(),
    content: text('content'),          // null for directories
    ...timestamps,
  },
  (table) => ({
    roomParentIdx: index('project_files_room_parent_idx').on(table.roomId, table.parentId),
    uniqueNameInParent: uniqueIndex('project_files_unique_name_idx').on(table.roomId, table.parentId, table.name),
  }),
);

export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  room: one(rooms, {
    fields: [projectFiles.roomId],
    references: [rooms.id],
  }),
  parent: one(projectFiles, {
    fields: [projectFiles.parentId],
    references: [projectFiles.id],
  }),
}));

export const activityEvents = pgTable(
  'activity_events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    eventId: uuid('event_id').notNull(),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    seq: bigint('seq', { mode: 'number' }).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorName: varchar('actor_name', { length: 80 }).notNull(),
    actorType: activityActorTypeEnum('actor_type').notNull(),
    eventType: activityEventTypeEnum('event_type').notNull(),
    targetFileId: integer('target_file_id').references(() => projectFiles.id, { onDelete: 'set null' }),
    targetScope: activityLockScopeEnum('target_scope'),
    targetUnitName: varchar('target_unit_name', { length: 255 }),
    outcome: activityOutcomeEnum('outcome'),
    reason: activityReasonEnum('reason'),
    correlationId: uuid('correlation_id'),
    versionRef: text('version_ref'),
    versionProduced: text('version_produced'),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    eventIdIdx: uniqueIndex('activity_events_event_id_idx').on(table.eventId),
    roomSeqIdx: uniqueIndex('activity_events_room_seq_idx').on(table.roomId, table.seq),
    roomOccurredIdx: index('activity_events_room_occurred_idx').on(table.roomId, table.occurredAt),
    actorIdx: index('activity_events_actor_idx').on(table.actorId),
    actorTypeIdx: index('activity_events_actor_type_idx').on(table.actorType),
    fileIdx: index('activity_events_file_idx').on(table.targetFileId),
    eventTypeIdx: index('activity_events_event_type_idx').on(table.eventType),
    outcomeIdx: index('activity_events_outcome_idx').on(table.outcome),
    correlationIdx: index('activity_events_correlation_idx').on(table.correlationId),
  }),
);

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  room: one(rooms, {
    fields: [activityEvents.roomId],
    references: [rooms.id],
  }),
  actor: one(users, {
    fields: [activityEvents.actorId],
    references: [users.id],
  }),
  targetFile: one(projectFiles, {
    fields: [activityEvents.targetFileId],
    references: [projectFiles.id],
  }),
}));

export const agentTasks = pgTable(
  'agent_tasks',
  {
    id: serial('id').primaryKey(),
    taskId: uuid('task_id').notNull(),
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    assignedBy: integer('assigned_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    agentUserId: integer('agent_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetFileId: integer('target_file_id').references(() => projectFiles.id, { onDelete: 'set null' }),
    instruction: text('instruction').notNull(),
    status: agentTaskStatusEnum('status').notNull().default('assigned'),
    currentStage: varchar('current_stage', { length: 40 }).notNull().default('assigned'),
    planSummary: text('plan_summary'),
    generatedCode: text('generated_code'),
    failureReason: text('failure_reason'),
    metadata: jsonb('metadata'),
    ...timestamps,
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    taskIdIdx: uniqueIndex('agent_tasks_task_id_idx').on(table.taskId),
    roomStatusIdx: index('agent_tasks_room_status_idx').on(table.roomId, table.status),
    roomCreatedIdx: index('agent_tasks_room_created_idx').on(table.roomId, table.createdAt),
  }),
);

export const agentTasksRelations = relations(agentTasks, ({ one }) => ({
  room: one(rooms, {
    fields: [agentTasks.roomId],
    references: [rooms.id],
  }),
  assignedByUser: one(users, {
    fields: [agentTasks.assignedBy],
    references: [users.id],
    relationName: 'assignedByTasks',
  }),
  agentUser: one(users, {
    fields: [agentTasks.agentUserId],
    references: [users.id],
    relationName: 'agentUserTasks',
  }),
  targetFile: one(projectFiles, {
    fields: [agentTasks.targetFileId],
    references: [projectFiles.id],
  }),
}));
