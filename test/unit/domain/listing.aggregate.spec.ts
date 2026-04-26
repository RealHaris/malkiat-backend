import { Listing } from '@modules/listing-management/domain/listing.aggregate';

import { minimalListingCreateInput } from '@test/fixtures/minimal-listing';

describe('Listing Aggregate', () => {
  describe('create', () => {
    it('should create a new listing with default DRAFT status', () => {
      const listing = Listing.create(minimalListingCreateInput());

      expect(listing.snapshot).toMatchObject({
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        title: 'Test Listing',
        priceAmount: '100000',
        currency: 'PKR',
        status: 'DRAFT',
      });
    });

    it('should create a listing with all core fields', () => {
      const listing = Listing.create(
        minimalListingCreateInput({
          title: 'Test Listing',
          description: 'Test Description',
          status: 'PUBLISHED',
          purpose: 'RENT',
          propertyCategory: 'PLOT',
        }),
      );

      expect(listing.snapshot).toMatchObject({
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        title: 'Test Listing',
        description: 'Test Description',
        priceAmount: '100000',
        currency: 'PKR',
        purpose: 'RENT',
        propertyCategory: 'PLOT',
        status: 'PUBLISHED',
      });
    });

    it('should generate ListingCreated domain event', () => {
      const listing = Listing.create(minimalListingCreateInput());

      const events = listing.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'ListingCreated',
        listingId: 'test-listing-id',
        ownerId: 'test-owner-id',
      });
    });

    it('should use provided status if given', () => {
      const listing = Listing.create(
        minimalListingCreateInput({
          status: 'PUBLISHED',
        }),
      );

      expect(listing.snapshot.status).toBe('PUBLISHED');
    });

    it('should default currency to PKR', () => {
      const listing = Listing.create(minimalListingCreateInput());

      expect(listing.snapshot.currency).toBe('PKR');
    });
  });

  describe('update', () => {
    it('should update listing fields', () => {
      const listing = Listing.create(
        minimalListingCreateInput({
          title: 'Original Title',
        }),
      );

      listing.update({
        title: 'Updated Title',
        description: 'Updated Description',
      });

      expect(listing.snapshot).toMatchObject({
        title: 'Updated Title',
        description: 'Updated Description',
      });
    });

    it('should update listing status', () => {
      const listing = Listing.create(minimalListingCreateInput({ status: 'DRAFT' }));

      listing.update({ status: 'PUBLISHED' });

      expect(listing.snapshot.status).toBe('PUBLISHED');
    });

    it('should keep PKR when updating other scalar fields', () => {
      const listing = Listing.create(minimalListingCreateInput());

      listing.update({ title: 'Renamed' });

      expect(listing.snapshot.currency).toBe('PKR');
      expect(listing.snapshot.title).toBe('Renamed');
    });

    it('should update propertyCategory', () => {
      const listing = Listing.create(minimalListingCreateInput());

      listing.update({ propertyCategory: 'PLOT' });

      expect(listing.snapshot.propertyCategory).toBe('PLOT');
    });

    it('should update priceAmount', () => {
      const listing = Listing.create(minimalListingCreateInput());

      listing.update({ priceAmount: '150000' });

      expect(listing.snapshot.priceAmount).toBe('150000');
    });

    it('should set updatedAt timestamp', () => {
      const listing = Listing.create(minimalListingCreateInput());

      const beforeUpdate = listing.snapshot.updatedAt;
      listing.update({ title: 'Updated' });
      const afterUpdate = listing.snapshot.updatedAt;

      expect(afterUpdate).not.toBeUndefined();
      if (beforeUpdate && afterUpdate) {
        expect(afterUpdate.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      }
    });

    it('should allow updating id', () => {
      const listing = Listing.create(minimalListingCreateInput());

      listing.update({ id: 'new-id' } as any);

      expect(listing.snapshot.id).toBe('new-id');
    });

    it('should allow updating ownerId', () => {
      const listing = Listing.create(minimalListingCreateInput());

      listing.update({ ownerId: 'new-owner-id' } as any);

      expect(listing.snapshot.ownerId).toBe('new-owner-id');
    });

    it('should generate ListingUpdated domain event', () => {
      const listing = Listing.create(minimalListingCreateInput());

      listing.pullDomainEvents();

      listing.update({ title: 'Updated Title' });

      const events = listing.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'ListingUpdated',
        listingId: 'test-listing-id',
        ownerId: 'test-owner-id',
      });
    });

    it('should update multiple fields at once', () => {
      const listing = Listing.create(
        minimalListingCreateInput({
          title: 'Original Title',
        }),
      );

      listing.update({
        title: 'New Title',
        description: 'New Description',
        priceAmount: '200000',
        propertyCategory: 'COMMERCIAL',
        status: 'PUBLISHED',
      });

      expect(listing.snapshot).toMatchObject({
        title: 'New Title',
        description: 'New Description',
        priceAmount: '200000',
        currency: 'PKR',
        propertyCategory: 'COMMERCIAL',
        status: 'PUBLISHED',
      });
    });
  });

  describe('markDeleted', () => {
    it('should generate ListingDeleted domain event', () => {
      const listing = Listing.create(minimalListingCreateInput());

      listing.pullDomainEvents();

      listing.markDeleted();

      const events = listing.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'ListingDeleted',
        listingId: 'test-listing-id',
        ownerId: 'test-owner-id',
      });
    });

    it('should not modify listing state', () => {
      const listing = Listing.create(minimalListingCreateInput());

      const beforeSnapshot = { ...listing.snapshot };
      listing.markDeleted();

      expect(listing.snapshot).toMatchObject(beforeSnapshot);
    });
  });

  describe('pullDomainEvents', () => {
    it('should return all domain events and clear them', () => {
      const listing = Listing.create(minimalListingCreateInput());

      const firstEvents = listing.pullDomainEvents();
      expect(firstEvents).toHaveLength(1);

      const secondEvents = listing.pullDomainEvents();
      expect(secondEvents).toHaveLength(0);
    });

    it('should accumulate multiple events', () => {
      const listing = Listing.create(minimalListingCreateInput());

      listing.update({ title: 'Updated' });
      listing.markDeleted();

      const events = listing.pullDomainEvents();

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('ListingCreated');
      expect(events[1].type).toBe('ListingUpdated');
      expect(events[2].type).toBe('ListingDeleted');
    });
  });

  describe('snapshot', () => {
    it('should return a copy of listing properties', () => {
      const listing = Listing.create(minimalListingCreateInput());

      const snapshot = listing.snapshot;

      expect(snapshot).toMatchObject({
        id: 'test-listing-id',
        ownerId: 'test-owner-id',
        title: 'Test Listing',
        priceAmount: '100000',
      });
    });

    it('should return immutable snapshot', () => {
      const listing = Listing.create(minimalListingCreateInput());

      const snapshot = listing.snapshot;
      snapshot.title = 'Modified';

      expect(listing.snapshot.title).toBe('Test Listing');
    });
  });
});
