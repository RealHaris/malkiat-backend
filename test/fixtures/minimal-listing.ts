import type { ListingProps } from '@modules/listing-management/domain/listing.aggregate';
import type { ListingStatus } from '@modules/listing-management/domain/listing-status';

import { MOCK_AREA_ID, MOCK_SUBTYPE_ID } from './factories';

const baseOmitStatus = (): Omit<ListingProps, 'status'> => ({
  id: 'test-listing-id',
  ownerId: 'test-owner-id',
  createdByUserId: 'test-owner-id',
  title: 'Test Listing',
  description: null,
  purpose: 'SELL',
  propertyCategory: 'HOME',
  propertySubtypeId: MOCK_SUBTYPE_ID,
  city: 'Karachi',
  areaId: MOCK_AREA_ID,
  locationText: 'Somewhere in Karachi',
  googleMapsUrl: null,
  latitude: null,
  longitude: null,
  areaValue: '100',
  areaUnit: 'SQFT',
  areaSqft: '100',
  priceAmount: '100000',
  currency: 'PKR',
  installmentAvailable: false,
  readyForPossession: false,
  imagesJson: [],
  platforms: ['ZAMEEN'],
  amenityIds: [],
  amenityValues: {},
  agencyId: null,
});

/** Valid input for `Listing.create` (optional `status`). */
export const minimalListingCreateInput = (
  overrides: Partial<Omit<ListingProps, 'status'>> & { status?: ListingStatus } = {},
): Omit<ListingProps, 'status'> & { status?: ListingStatus } => ({
  ...baseOmitStatus(),
  ...overrides,
});

/** Full props for `Listing.rehydrate` (includes `status`). */
export const minimalListingProps = (overrides: Partial<ListingProps> = {}): ListingProps => ({
  ...baseOmitStatus(),
  status: 'DRAFT',
  ...overrides,
});
