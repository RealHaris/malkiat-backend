import { z } from 'zod';
import {
  AREA_UNITS,
  CURRENCY_CODES,
  LISTING_CONDITIONS,
  LISTING_PURPOSES,
  PROPERTY_CATEGORIES,
  VALIDATION_MESSAGES,
  WEEKDAYS,
} from '@shared/constants/api.constants';

const createListingSchema = z.object({
  action: z.enum(['draft', 'submit']).optional().default('draft'),
  title: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED('Title') })
    .min(3, VALIDATION_MESSAGES.MIN_LENGTH('Title', 3))
    .max(200, VALIDATION_MESSAGES.MAX_LENGTH('Title', 200)),
  description: z.string().max(2000, VALIDATION_MESSAGES.MAX_LENGTH('Description', 2000)).optional(),
  purpose: z.enum(LISTING_PURPOSES),
  propertyCategory: z.enum(PROPERTY_CATEGORIES),
  propertySubtypeId: z
    .string()
    .uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Property subtype ID') }),
  city: z
    .string()
    .optional()
    .default('Karachi')
    .refine((v) => v === 'Karachi', {
      message: VALIDATION_MESSAGES.KARACHI_REQUIRED,
    }),
  areaId: z.string().uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Area ID') }),
  locationText: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED('Location') })
    .min(3, VALIDATION_MESSAGES.MIN_LENGTH('Location', 3))
    .max(500, VALIDATION_MESSAGES.MAX_LENGTH('Location', 500)),
  googleMapsUrl: z.string().url().optional(),
  areaValue: z
    .number({ required_error: VALIDATION_MESSAGES.REQUIRED('Area value') })
    .positive(VALIDATION_MESSAGES.POSITIVE_NUMBER('Area value')),
  areaUnit: z.enum(AREA_UNITS),
  priceAmount: z
    .number({ required_error: VALIDATION_MESSAGES.REQUIRED('Price amount') })
    .positive(VALIDATION_MESSAGES.POSITIVE_NUMBER('Price amount')),
  currency: z
    .enum(CURRENCY_CODES, {
      message: VALIDATION_MESSAGES.INVALID_ENUM('Currency', [...CURRENCY_CODES]),
    })
    .optional(),
  condition: z.enum(LISTING_CONDITIONS).optional(),
  availability: z
    .object({
      days: z
        .array(z.enum(WEEKDAYS))
        .min(1, VALIDATION_MESSAGES.REQUIRED('Availability days'))
        .transform((days) => [...new Set(days)]),
    })
    .nullable()
    .optional(),
  agencyId: z.string().uuid().optional(),
  installmentAvailable: z.boolean().optional().default(false),
  readyForPossession: z.boolean().optional().default(false),
  bedroomsCount: z.number().int().min(0).max(10).optional(),
  bathroomsCount: z.number().int().min(1).max(6).optional(),
  amenityIds: z.array(z.string().uuid()).optional().default([]),
  amenityValues: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .default({}),
  imagesJson: z.array(z.string().url()).max(5).optional().default([]),
  videoUrl: z.string().url().optional(),
  platforms: z.array(z.string()).optional().default(['ZAMEEN']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type CreateListingDto = z.infer<typeof createListingSchema>;
export { createListingSchema };
