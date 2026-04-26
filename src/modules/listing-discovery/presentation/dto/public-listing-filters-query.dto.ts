import { z } from 'zod';

/** Query-string list: repeat keys or comma-separated (matches `qs` from the Next app). */
const stringListQuery = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    const arr = Array.isArray(val) ? val : String(val).split(',');
    const out = arr.map((s) => String(s).trim()).filter(Boolean);
    return out.length ? out : undefined;
  });

/**
 * Shared facet filters for `GET /public/listings`, `/discovery`, and `/search`.
 * Frontend sends `includeLocations`, `excludeLocations`, `propertySubtype`, `minAreaSqyd` / `maxAreaSqyd`.
 */
export const publicListingFilterQuerySchema = z.object({
  areaIds: stringListQuery,
  includeLocations: stringListQuery,
  excludeLocations: stringListQuery,
  purpose: z.enum(['SELL', 'RENT']).optional(),
  propertyCategory: z.enum(['HOME', 'PLOT', 'COMMERCIAL']).optional(),
  /** Subtype display name (resolved server-side with `propertyCategory`). */
  propertySubtype: z.string().optional(),
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
  minAreaSqyd: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive().optional()),
  maxAreaSqyd: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive().optional()),
  bedroomsCount: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
});

export type PublicListingFilterQueryDto = z.infer<typeof publicListingFilterQuerySchema>;
