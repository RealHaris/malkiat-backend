import { z } from 'zod';
import { VALIDATION_MESSAGES } from '@shared/constants/api.constants';

const deleteListingSchema = z.object({
  id: z
    .string()
    .uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Listing ID') }),
  ownerId: z
    .string()
    .uuid({ message: VALIDATION_MESSAGES.INVALID_UUID('Owner ID') }),
});

export type DeleteListingDto = z.infer<typeof deleteListingSchema>;
export { deleteListingSchema };
