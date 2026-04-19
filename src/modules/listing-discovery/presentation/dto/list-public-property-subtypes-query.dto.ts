import { z } from 'zod';
import { PROPERTY_CATEGORIES } from '@shared/constants/api.constants';

export const listPublicPropertySubtypesQuerySchema = z.object({
  category: z.enum(PROPERTY_CATEGORIES).optional(),
});

export type ListPublicPropertySubtypesQueryDto = z.infer<typeof listPublicPropertySubtypesQuerySchema>;
