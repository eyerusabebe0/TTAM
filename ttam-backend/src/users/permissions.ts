export const Permission = {
  REGISTER_AGENTS: 'registerAgents',
  VIEW_PAYMENTS: 'viewPayments',
  VIEW_BOOKINGS: 'viewBookings',
  APPROVE_BOOKINGS: 'approveBookings',
  REGISTER_MANAGERS: 'registerManagers',
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

// Agents can't have registerManagers
export const AGENT_PERMISSIONS: readonly string[] = [
  Permission.REGISTER_AGENTS,
  Permission.VIEW_PAYMENTS,
  Permission.VIEW_BOOKINGS,
];
export const MANAGER_PERMISSIONS: readonly string[] = Object.values(Permission);

// Builds a clean { key: true/false } object. Unknown keys are dropped, and only a real `true` counts.
export function cleanPermissions(input: Record<string, unknown> | undefined, allowed: readonly string[]) {
  const result: Record<string, boolean> = {};
  for (const key of allowed) result[key] = input?.[key] === true;
  return result;
}

// Owner can do everything; everyone else needs the explicit flag
export function hasPermission(user: { role: string; permissions?: Record<string, boolean> }, key: PermissionKey) {
  return user.role === 'owner' || user.permissions?.[key] === true;
}