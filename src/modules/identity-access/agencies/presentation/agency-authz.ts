import { ForbiddenException } from '@nestjs/common';

export type AuthzUser = {
  id: string;
  platformRole?: 'admin' | 'user';
};

export type AgencyRole = 'owner' | 'co-owner' | 'admin' | 'manager' | 'agent';

export type Membership = {
  userId: string;
  membershipRole: AgencyRole;
  status: 'active' | 'removed';
};

export const ROLE_HIERARCHY: Record<AgencyRole, number> = {
  owner: 100,
  'co-owner': 80,
  admin: 60,
  manager: 40,
  agent: 20,
};

export const isPlatformAdmin = (user?: AuthzUser | null) => user?.platformRole === 'admin';

export function requireAgencyOwnerOrAdmin(user: AuthzUser, membership?: Membership | null): void {
  if (isPlatformAdmin(user)) return;
  if (
    membership?.status === 'active' &&
    ['owner', 'co-owner', 'admin'].includes(membership.membershipRole)
  )
    return;
  throw new ForbiddenException('You are not allowed to perform this action on this agency');
}

export function canPostForAgency(user: AuthzUser, membership?: Membership | null): boolean {
  if (isPlatformAdmin(user)) return true;
  if (!membership) return false;
  return membership.status === 'active';
}

export function canManageMember(
  actor: AuthzUser,
  actorMembership: Membership | null,
  targetCurrentRole?: AgencyRole,
  targetNewRole?: AgencyRole,
): boolean {
  if (isPlatformAdmin(actor)) return true;
  if (!actorMembership || actorMembership.status !== 'active') return false;

  const actorLevel = ROLE_HIERARCHY[actorMembership.membershipRole];

  if (actorLevel === 100) return true; // Primary owner can do anything

  if (targetCurrentRole && actorLevel <= ROLE_HIERARCHY[targetCurrentRole]) {
    return false;
  }

  if (targetNewRole && actorLevel <= ROLE_HIERARCHY[targetNewRole]) {
    return false;
  }

  return true;
}
