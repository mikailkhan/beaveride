import {
  boolean,
  customType,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoomRoleEnum = pgEnum('user_room_role', ['owner', 'editor', 'viewer']);
export const runStatusEnum = pgEnum('run_status', ['queued', 'running', 'success', 'error', 'cancelled']);

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
