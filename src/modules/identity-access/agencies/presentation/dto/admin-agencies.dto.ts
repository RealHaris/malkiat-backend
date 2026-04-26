import { z } from 'zod';

export const listAdminAgenciesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(120).default(''),
  status: z.enum(['active', 'inactive']).optional(),
  sort: z.enum(['newest', 'oldest', 'memberCount', 'listingCount', 'name']).default('newest'),
});

export const updateAgencyStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

export type ListAdminAgenciesQueryDto = z.infer<typeof listAdminAgenciesQuerySchema>;
export type UpdateAgencyStatusDto = z.infer<typeof updateAgencyStatusSchema>;
