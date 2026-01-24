import { z } from "zod";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  CURRENCY_CODES,
  PAGINATION,
  PROPERTY_TYPES,
  SEARCH_SORT_OPTIONS,
  VALIDATION_MESSAGES,
} from "@shared/constants/api.constants";

const searchListingsQuerySchema = z.object({
  q: z.string().optional().default(""),
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
  sort: z
    .enum([...SEARCH_SORT_OPTIONS] as ["relevance", "newest", "price_asc", "price_desc"])
    .optional(),
  propertyType: z.enum([...PROPERTY_TYPES] as [string, ...string[]]).optional(),
  currency: z.enum([...CURRENCY_CODES] as [string, ...string[]]).optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive(VALIDATION_MESSAGES.POSITIVE_NUMBER("Minimum price")).optional()),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive(VALIDATION_MESSAGES.POSITIVE_NUMBER("Maximum price")).optional()),
});

export type SearchListingsQueryDto = z.infer<typeof searchListingsQuerySchema>;
export { searchListingsQuerySchema };
