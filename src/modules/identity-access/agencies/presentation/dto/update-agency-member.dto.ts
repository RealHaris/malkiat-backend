import { z } from 'zod';

export const updateAgencyMemberSchema = z.object({
  membershipRole: z.enum(['owner', 'agent']),
});

export type UpdateAgencyMemberDto = z.infer<typeof updateAgencyMemberSchema>;
