export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];
