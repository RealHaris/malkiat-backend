import { z } from 'zod';
import {
  DISCOVERY_SORT_OPTIONS,
  PAGINATION,
  VALIDATION_MESSAGES,
} from '@shared/constants/api.constants';

import { publicListingFilterQuerySchema } from '@modules/listing-discovery/presentation/dto/public-listing-filters-query.dto';

const discoverListingsQuerySchema = z
  .object({
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
    sort: z.enum([...DISCOVERY_SORT_OPTIONS] as ['newest', 'price_asc', 'price_desc']).optional(),
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
  })
  .merge(publicListingFilterQuerySchema);

export type DiscoverListingsQueryDto = z.infer<typeof discoverListingsQuerySchema>;
export { discoverListingsQuerySchema };
