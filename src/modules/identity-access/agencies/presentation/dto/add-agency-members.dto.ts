import { z } from 'zod';

const memberRoleEnum = z.enum(['co-owner', 'admin', 'manager', 'agent']);

const memberSchema = z
  .object({
    userId: z.string().min(1).optional(),
    email: z.string().email().optional(),
    membershipRole: memberRoleEnum.default('agent'),
  })
  .refine((value) => Boolean(value.userId) !== Boolean(value.email), {
    message: 'Provide exactly one of userId or email',
    path: ['userId'],
  });

export const addAgencyMembersSchema = z.object({
  members: z.array(memberSchema).min(1).max(50),
});

export type AddAgencyMembersDto = z.infer<typeof addAgencyMembersSchema>;
