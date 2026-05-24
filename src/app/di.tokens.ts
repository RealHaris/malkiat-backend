export const DI = {
  DrizzleDb: Symbol('DrizzleDb'),
  UnitOfWork: Symbol('UnitOfWork'),
  OutboxRepository: Symbol('OutboxRepository'),

  TypesenseClient: Symbol('TypesenseClient'),

  ListingRepository: Symbol('ListingRepository'),
  ListingEventsPublisher: Symbol('ListingEventsPublisher'),
  AgencyRepository: Symbol('AgencyRepository'),

  RedisClient: Symbol('RedisClient'),
  BetterAuth: Symbol('BetterAuth'),
} as const;
