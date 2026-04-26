import { z } from 'zod';

export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1),
  demoteOldOwnerTo: z.enum(['co-owner', 'admin', 'manager', 'agent']).optional(),
});

export type TransferOwnershipDto = z.infer<typeof transferOwnershipSchema>;
