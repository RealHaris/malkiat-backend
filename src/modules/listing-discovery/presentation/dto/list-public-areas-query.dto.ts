import { z } from 'zod';

import { VALIDATION_MESSAGES } from '@shared/constants/api.constants';

export const listPublicAreasQuerySchema = z.object({
  city: z
    .string()
    .optional()
    .default('Karachi')
    .refine((v) => v === 'Karachi', {
      message: VALIDATION_MESSAGES.KARACHI_REQUIRED,
    }),
  q: z.string().trim().max(160, VALIDATION_MESSAGES.MAX_LENGTH('Query', 160)).optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 2000))
    .pipe(
      z
        .number()
        .min(1, VALIDATION_MESSAGES.MIN_VALUE('Limit', 1))
        .max(5000, VALIDATION_MESSAGES.MAX_VALUE('Limit', 5000)),
    ),
});

export type ListPublicAreasQueryDto = z.infer<typeof listPublicAreasQuerySchema>;
