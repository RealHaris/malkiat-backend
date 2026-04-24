import { z } from 'zod';

import type { ListingStatus } from '@modules/listing-management/domain/listing-status';
import { LISTING_STATUS, VALIDATION_MESSAGES } from '@shared/constants/api.constants';

export const changeListingStatusSchema = z.object({
  status: z.enum([...LISTING_STATUS] as [ListingStatus, ...ListingStatus[]], {
    message: VALIDATION_MESSAGES.INVALID_ENUM('Status', LISTING_STATUS as unknown as string[]),
  }),
});

export type ChangeListingStatusDto = z.infer<typeof changeListingStatusSchema>;
