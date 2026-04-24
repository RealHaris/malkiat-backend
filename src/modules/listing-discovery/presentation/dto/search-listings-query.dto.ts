import { z } from 'zod';
import {
  PAGINATION,
  SEARCH_SORT_OPTIONS,
  VALIDATION_MESSAGES,
} from '@shared/constants/api.constants';

const searchListingsQuerySchema = z.object({
  q: z.string().optional().default('*'),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_PAGE))
    .pipe(z.number().min(1, VALIDATION_MESSAGES.MIN_VALUE('Page', 1))),
  perPage: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_PER_PAGE))
    .pipe(
      z
        .number()
        .min(1, VALIDATION_MESSAGES.MIN_VALUE('Per page', 1))
        .max(100, VALIDATION_MESSAGES.MAX_VALUE('Per page', 100)),
    ),
  city: z
    .string()
    .optional()
    .default('Karachi')
    .refine((v) => v === 'Karachi', {
      message: VALIDATION_MESSAGES.KARACHI_REQUIRED,
    }),
  areaIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => (Array.isArray(val) ? val : val ? val.split(',') : undefined)),
  purpose: z.enum(['SELL', 'RENT']).optional(),
  propertyCategory: z.enum(['HOME', 'PLOT', 'COMMERCIAL']).optional(),
  propertySubtypeId: z.string().uuid().optional(),
  minAreaSqft: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive().optional()),
  maxAreaSqft: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive().optional()),
  bedroomsCount: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
  sort: z
    .enum([...SEARCH_SORT_OPTIONS] as ['relevance', 'newest', 'price_asc', 'price_desc'])
    .optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive(VALIDATION_MESSAGES.POSITIVE_NUMBER('Minimum price')).optional()),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive(VALIDATION_MESSAGES.POSITIVE_NUMBER('Maximum price')).optional()),
});

export type SearchListingsQueryDto = z.infer<typeof searchListingsQuerySchema>;
export { searchListingsQuerySchema };
