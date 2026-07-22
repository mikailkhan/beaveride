export type ActivityEventType = 
  | 'joined' 
  | 'left' 
  | 'global_run' 
  | 'code_edit' 
  | 'role_changed' 
  | 'run_toggled' 
  | 'kicked';

export interface ActivityEntry {
  username: string;
  event: ActivityEventType;
  timestamp: string; // ISO 8601
  targetUsername?: string;
  detail?: string;
}

const store = new Map<number, ActivityEntry[]>();
const MAX_ENTRIES = 100;

export function addActivity(roomId: number, entry: ActivityEntry): void {
  let entries = store.get(roomId);
  if (!entries) {
    entries = [];
    store.set(roomId, entries);
  }
  entries.unshift(entry); // Newest first
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }
}

export function getActivities(roomId: number): ActivityEntry[] {
  return store.get(roomId) ?? [];
}

export function clearActivities(roomId: number): void {
  store.delete(roomId);
}
