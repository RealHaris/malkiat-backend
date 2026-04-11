import { z } from 'zod';

export const updateAgencySchema = z.object({
  name: z.string().min(3).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
});

export type UpdateAgencyDto = z.infer<typeof updateAgencySchema>;
