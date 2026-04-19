import { ForbiddenException } from '@nestjs/common';

export type AuthzUser = {
  id: string;
  platformRole?: 'admin' | 'user';
};

export type Membership = {
  userId: string;
  membershipRole: 'owner' | 'agent';
  status: 'active' | 'removed';
};

export const isPlatformAdmin = (user?: AuthzUser | null) => user?.platformRole === 'admin';

export function requireAgencyOwnerOrAdmin(user: AuthzUser, membership?: Membership | null): void {
  if (isPlatformAdmin(user)) return;
  if (membership?.status === 'active' && membership.membershipRole === 'owner') return;
  throw new ForbiddenException('You are not allowed to perform this action on this agency');
}

export function canPostForAgency(user: AuthzUser, membership?: Membership | null): boolean {
  if (isPlatformAdmin(user)) return true;
  if (!membership) return false;
  return membership.status === 'active' && (membership.membershipRole === 'owner' || membership.membershipRole === 'agent');
}
