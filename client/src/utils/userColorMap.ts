export interface UserColorInfo {
  bg: string;
  border: string;
  icon: string;
  label: string;
  classIndex: number;
}

const PALETTE: Array<{ bg: string; border: string; icon: string; label: string }> = [
  { bg: 'rgba(0, 178, 162, 0.15)', border: 'rgba(0, 178, 162, 0.5)', icon: '#00b2a2', label: 'Teal' },
  { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.5)', icon: '#8b5cf6', label: 'Purple' },
  { bg: 'rgba(234, 88, 12, 0.15)', border: 'rgba(234, 88, 12, 0.5)', icon: '#ea580c', label: 'Orange' },
  { bg: 'rgba(22, 163, 74, 0.15)', border: 'rgba(22, 163, 74, 0.5)', icon: '#16a34a', label: 'Green' },
  { bg: 'rgba(219, 39, 119, 0.15)', border: 'rgba(219, 39, 119, 0.5)', icon: '#db2777', label: 'Pink' },
  { bg: 'rgba(79, 70, 229, 0.15)', border: 'rgba(79, 70, 229, 0.5)', icon: '#4f46e5', label: 'Indigo' },
  { bg: 'rgba(217, 119, 6, 0.15)', border: 'rgba(217, 119, 6, 0.5)', icon: '#d97706', label: 'Amber' },
  { bg: 'rgba(2, 132, 199, 0.15)', border: 'rgba(2, 132, 199, 0.5)', icon: '#0284c7', label: 'Cyan' },
];

const MINE_COLOR: UserColorInfo = {
  bg: 'rgba(59, 130, 246, 0.2)',
  border: 'rgba(59, 130, 246, 0.6)',
  icon: '#3b82f6',
  label: 'Blue (You)',
  classIndex: -1,
};

const AGENT_COLOR: UserColorInfo = {
  bg: 'rgba(99, 102, 241, 0.2)',
  border: 'rgba(99, 102, 241, 0.6)',
  icon: '#6366f1',
  label: 'Indigo (BOT)',
  classIndex: -2,
};

/**
 * Deterministically maps a collaborator userId to a stable HSL palette color.
 * Agent users always return a dedicated agent indigo color.
 * Current user's own locks always return the standard primary blue color.
 */
export function getUserColor(userId: number, currentUserId?: number, isAgent?: boolean): UserColorInfo {
  if (isAgent || Number(userId) === 901) {
    return AGENT_COLOR;
  }
  if (currentUserId !== undefined && Number(userId) === Number(currentUserId)) {
    return MINE_COLOR;
  }
  const index = Math.abs(userId) % PALETTE.length;
  const color = PALETTE[index];
  return {
    ...color,
    classIndex: index,
  };
}
