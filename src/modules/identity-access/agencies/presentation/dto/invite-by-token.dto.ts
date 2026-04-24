import { z } from 'zod';

export const acceptInviteByTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  agencyId: z.string().uuid('agencyId must be a valid UUID'),
});

export type AcceptInviteByTokenDto = z.infer<typeof acceptInviteByTokenSchema>;
