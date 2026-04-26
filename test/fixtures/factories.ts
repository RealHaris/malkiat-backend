import type { ListingProps } from '@modules/listing-management/domain/listing.aggregate';
import type { UserSession } from '@thallesp/nestjs-better-auth';

export const MOCK_SUBTYPE_ID = '00000000-0000-4000-8000-000000000099';
export const MOCK_AREA_ID = '00000000-0000-4000-8000-000000000088';

export const createMockListing = (overrides: Partial<ListingProps> = {}): ListingProps => ({
  id: generateMockId(),
  ownerId: generateMockId(),
  title: 'Beautiful Modern Apartment',
  description: 'A stunning apartment in the heart of the city',
  purpose: 'SELL',
  propertyCategory: 'HOME',
  propertySubtypeId: MOCK_SUBTYPE_ID,
  city: 'Karachi',
  areaId: MOCK_AREA_ID,
  locationText: 'Test Area, Karachi',
  areaValue: '5',
  areaUnit: 'MARLA',
  areaSqft: '1125',
  priceAmount: '5000000',
  currency: 'PKR',
  installmentAvailable: false,
  readyForPossession: false,
  imagesJson: [],
  platforms: ['ZAMEEN'],
  status: 'DRAFT',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (overrides: Partial<UserSession> = {}): UserSession => ({
  user: {
    id: generateMockId(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    image: null,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: generateMockId(),
    userId: generateMockId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    token: 'mock-session-token',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  },
  ...overrides,
});

function generateMockId(): string {
  return `mock-${Math.random().toString(36).slice(2, 11)}`;
}

export const createMockListingCard = () => ({
  id: generateMockId(),
  ownerId: generateMockId(),
  title: 'Test Listing',
  description: null,
  purpose: 'SELL' as const,
  propertyCategory: 'HOME' as const,
  propertySubtypeId: MOCK_SUBTYPE_ID,
  city: 'Karachi',
  areaId: MOCK_AREA_ID,
  locationText: 'Test',
  googleMapsUrl: null,
  areaValue: 5,
  areaUnit: 'MARLA' as const,
  areaSqft: 1125,
  priceAmount: 5000000,
  currency: 'PKR' as const,
  condition: null,
  availability: null,
  installmentAvailable: false,
  readyForPossession: false,
  bedroomsCount: 2,
  bathroomsCount: 2,
  imagesJson: [],
  videoUrl: null,
  platforms: ['ZAMEEN'],
  status: 'PUBLISHED',
  publishedAt: null,
  createdAt: Date.now(),
});

export const createMockPaginatedResult = <T>(
  items: T[],
  found?: number,
  page?: number,
  perPage?: number,
) => ({
  items,
  page: page ?? 1,
  perPage: perPage ?? 20,
  found: found !== undefined ? found : items.length,
});
