import { z } from 'zod';
import {
  AREA_UNITS,
  CURRENCY_CODES,
  LISTING_CONDITIONS,
  LISTING_PURPOSES,
  LISTING_STATUS,
  PROPERTY_CATEGORIES,
  VALIDATION_MESSAGES,
  WEEKDAYS,
} from '@shared/constants/api.constants';
import { ListingStatus } from '../../domain/listing-status';

const updateListingSchema = z.object({
  id: z.string().uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Listing ID') }),
  title: z
    .string()
    .min(3, VALIDATION_MESSAGES.MIN_LENGTH('Title', 3))
    .max(200, VALIDATION_MESSAGES.MAX_LENGTH('Title', 200))
    .optional(),
  description: z.string().max(2000, VALIDATION_MESSAGES.MAX_LENGTH('Description', 2000)).optional(),
  purpose: z.enum(LISTING_PURPOSES).optional(),
  propertyCategory: z.enum(PROPERTY_CATEGORIES).optional(),
  propertySubtypeId: z
    .string()
    .uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Property subtype ID') })
    .optional(),
  city: z
    .string()
    .optional()
    .refine((v) => !v || v === 'Karachi', { message: VALIDATION_MESSAGES.KARACHI_REQUIRED }),
  areaId: z
    .string()
    .uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Area ID') })
    .optional(),
  locationText: z
    .string()
    .min(3, VALIDATION_MESSAGES.MIN_LENGTH('Location', 3))
    .max(500)
    .optional(),
  googleMapsUrl: z.string().url().nullable().optional(),
  agencyId: z.string().uuid().nullable().optional(),
  areaValue: z.number().positive(VALIDATION_MESSAGES.POSITIVE_NUMBER('Area value')).optional(),
  areaUnit: z.enum(AREA_UNITS).optional(),
  priceAmount: z.number().positive(VALIDATION_MESSAGES.POSITIVE_NUMBER('Price amount')).optional(),
  currency: z
    .enum(CURRENCY_CODES, {
      message: VALIDATION_MESSAGES.INVALID_ENUM('Currency', [...CURRENCY_CODES]),
    })
    .optional(),
  condition: z.enum(LISTING_CONDITIONS).nullable().optional(),
  availability: z
    .object({
      days: z
        .array(z.enum(WEEKDAYS))
        .min(1, VALIDATION_MESSAGES.REQUIRED('Availability days'))
        .transform((days) => [...new Set(days)]),
    })
    .nullable()
    .optional(),
  installmentAvailable: z.boolean().optional(),
  readyForPossession: z.boolean().optional(),
  bedroomsCount: z.number().int().min(0).max(10).optional(),
  bathroomsCount: z.number().int().min(1).max(6).optional(),
  amenityIds: z.array(z.string().uuid()).optional(),
  imagesJson: z.array(z.string().url()).max(5).optional(),
  videoUrl: z.string().url().nullable().optional(),
  platforms: z.array(z.string()).optional(),
  phoneNumbers: z
    .array(z.string())
    .min(2, VALIDATION_MESSAGES.REQUIRED('Phone numbers'))
    .max(5, VALIDATION_MESSAGES.MAX_LENGTH('Phone numbers', 5))
    .refine(
      (numbers) => numbers.some((item) => item.startsWith('wa:')),
      'WhatsApp number is required',
    )
    .refine(
      (numbers) => numbers.some((item) => !item.startsWith('wa:')),
      'Phone number is required',
    )
    .refine(
      (numbers) => numbers.every((item) => /^wa:\+92\d{11}$/.test(item) || /^\+92\d{11}$/.test(item)),
      'Phone numbers must be in +92 format with 11 digits',
    )
    .optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  status: z
    .enum([...LISTING_STATUS] as [ListingStatus, ...ListingStatus[]], {
      message: VALIDATION_MESSAGES.INVALID_ENUM('Status', LISTING_STATUS as unknown as string[]),
    })
    .optional(),
});

export type UpdateListingDto = z.infer<typeof updateListingSchema>;
export { updateListingSchema };
