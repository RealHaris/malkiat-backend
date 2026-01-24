import { z } from 'zod';
import {
  CURRENCY_CODES,
  LISTING_STATUS,
  PROPERTY_TYPES,
  VALIDATION_MESSAGES,
} from '@shared/constants/api.constants';
import { ListingStatus } from '../../domain/listing-status';

const updateListingSchema = z.object({
  id: z
    .string()
    .uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Listing ID') }),
  ownerId: z
    .string()
    .uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Owner ID') }),
  title: z
    .string()
    .min(3, VALIDATION_MESSAGES.MIN_LENGTH('Title', 3))
    .max(200, VALIDATION_MESSAGES.MAX_LENGTH('Title', 200))
    .optional(),
  description: z
    .string()
    .max(2000, VALIDATION_MESSAGES.MAX_LENGTH('Description', 2000))
    .optional(),
  priceAmount: z
    .number()
    .positive(VALIDATION_MESSAGES.POSITIVE_NUMBER('Price amount'))
    .optional(),
  currency: z
    .enum([...CURRENCY_CODES] as [string, ...string[]], {
      message: VALIDATION_MESSAGES.INVALID_ENUM('Currency', CURRENCY_CODES),
    })
    .optional(),
  propertyType: z
    .enum([...PROPERTY_TYPES] as [string, ...string[]], {
      message: VALIDATION_MESSAGES.INVALID_ENUM(
        'Property type',
        PROPERTY_TYPES,
      ),
    })
    .optional(),
  status: z
    .enum([...LISTING_STATUS] as [ListingStatus, ...ListingStatus[]], {
      message: VALIDATION_MESSAGES.INVALID_ENUM(
        'Status',
        LISTING_STATUS as unknown as string[],
      ),
    })
    .optional(),
});

export type UpdateListingDto = z.infer<typeof updateListingSchema>;
export { updateListingSchema };
