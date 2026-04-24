import { z } from 'zod';

export const updateAgencyMemberSchema = z.object({
  membershipRole: z.enum(['owner', 'co-owner', 'admin', 'manager', 'agent']),
});

export type UpdateAgencyMemberDto = z.infer<typeof updateAgencyMemberSchema>;
