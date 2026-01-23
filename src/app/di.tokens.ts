export const DI = {
  DrizzleDb: Symbol('DrizzleDb'),
  UnitOfWork: Symbol('UnitOfWork'),
  OutboxRepository: Symbol('OutboxRepository'),

  RedisClient: Symbol('RedisClient'),
  RedisListingReadModel: Symbol('RedisListingReadModel'),
  RedisListingProjectionWriter: Symbol('RedisListingProjectionWriter'),

  BullmqConnection: Symbol('BullmqConnection'),
  SyncQueue: Symbol('SyncQueue'),
} as const;
