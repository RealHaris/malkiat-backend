import { z } from "zod";
import {
  CURRENCY_CODES,
  DISCOVERY_SORT_OPTIONS,
  PAGINATION,
  PROPERTY_TYPES,
  VALIDATION_MESSAGES,
} from "@shared/constants/api.constants";

const discoverListingsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_PAGE))
    .pipe(z.number().min(1, VALIDATION_MESSAGES.MIN_VALUE("Page", 1))),
  perPage: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_PER_PAGE))
    .pipe(
      z
        .number()
        .min(1, VALIDATION_MESSAGES.MIN_VALUE("Per page", 1))
        .max(100, VALIDATION_MESSAGES.MAX_VALUE("Per page", 100)),
    ),
  sort: z.enum([...DISCOVERY_SORT_OPTIONS] as ["newest", "price_asc", "price_desc"]).optional(),
  propertyType: z.enum([...PROPERTY_TYPES] as [string, ...string[]]).optional(),
  currency: z.enum([...CURRENCY_CODES] as [string, ...string[]]).optional(),
});

export type DiscoverListingsQueryDto = z.infer<typeof discoverListingsQuerySchema>;
export { discoverListingsQuerySchema };
