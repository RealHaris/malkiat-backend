export const ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  USER: 'user',
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];
