import { z } from 'zod';
import {
  CURRENCY_CODES,
  PROPERTY_TYPES,
  VALIDATION_MESSAGES,
} from '@shared/constants/api.constants';

const createListingSchema = z.object({
  id: z.string().uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Listing ID') }),
  ownerId: z.string().uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Owner ID') }),
  title: z
    .string({ required_error: VALIDATION_MESSAGES.REQUIRED('Title') })
    .min(3, VALIDATION_MESSAGES.MIN_LENGTH('Title', 3))
    .max(200, VALIDATION_MESSAGES.MAX_LENGTH('Title', 200)),
  description: z.string().max(2000, VALIDATION_MESSAGES.MAX_LENGTH('Description', 2000)).optional(),
  priceAmount: z
    .number({ required_error: VALIDATION_MESSAGES.REQUIRED('Price amount') })
    .positive(VALIDATION_MESSAGES.POSITIVE_NUMBER('Price amount')),
  currency: z
    .enum([...CURRENCY_CODES] as [string, ...string[]], {
      message: VALIDATION_MESSAGES.INVALID_ENUM('Currency', CURRENCY_CODES),
    })
    .optional(),
  propertyType: z
    .enum([...PROPERTY_TYPES] as [string, ...string[]], {
      message: VALIDATION_MESSAGES.INVALID_ENUM('Property type', PROPERTY_TYPES),
    })
    .optional(),
});

export type CreateListingDto = z.infer<typeof createListingSchema>;
export { createListingSchema };
