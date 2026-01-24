import type { ListingProps } from '@modules/listing-management/domain/listing.aggregate';
import type { UserSession } from '@thallesp/nestjs-better-auth';

export const createMockListing = (
  overrides: Partial<ListingProps> = {},
): ListingProps => ({
  id: generateMockId(),
  ownerId: generateMockId(),
  title: 'Beautiful Modern Apartment',
  description: 'A stunning apartment in the heart of the city',
  priceAmount: '5000000',
  currency: 'PKR',
  propertyType: 'apartment',
  status: 'DRAFT',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (
  overrides: Partial<UserSession> = {},
): UserSession => ({
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

export const createMockPaginatedResult = <T>(
  items: T[] = [],
  total: number = items.length,
  page: number = 1,
  perPage: number = 20,
) => ({
  data: items,
  meta: {
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  },
});

export const createMockListingCard = () => ({
  id: generateMockId(),
  title: 'Beautiful Modern Apartment',
  description: 'A stunning apartment in the heart of the city',
  priceAmount: '5000000',
  currency: 'PKR',
  propertyType: 'apartment',
  status: 'DRAFT' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const createMockDomainEvent = (
  type: 'ListingCreated' | 'ListingUpdated' | 'ListingDeleted',
  listingId: string = generateMockId(),
  ownerId: string = generateMockId(),
) => ({
  type,
  listingId,
  ownerId,
});

function generateMockId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
