import { z } from 'zod';

export const createAgencySchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
});

export type CreateAgencyDto = z.infer<typeof createAgencySchema>;
