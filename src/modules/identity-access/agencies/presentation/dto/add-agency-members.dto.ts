import { z } from 'zod';

const memberSchema = z.object({
  userId: z.string().min(1),
  membershipRole: z.enum(['owner', 'agent']).default('agent'),
});

export const addAgencyMembersSchema = z.object({
  members: z.array(memberSchema).min(1).max(50),
});

export type AddAgencyMembersDto = z.infer<typeof addAgencyMembersSchema>;
