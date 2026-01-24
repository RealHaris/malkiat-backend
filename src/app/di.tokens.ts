export const DI = {
  DrizzleDb: Symbol("DrizzleDb"),
  UnitOfWork: Symbol("UnitOfWork"),
  OutboxRepository: Symbol("OutboxRepository"),

  RedisClient: Symbol("RedisClient"),

  TypesenseClient: Symbol("TypesenseClient"),

  BullmqConnection: Symbol("BullmqConnection"),
  ListingEventsQueue: Symbol("ListingEventsQueue"),

  ListingRepository: Symbol("ListingRepository"),
  ListingEventsPublisher: Symbol("ListingEventsPublisher"),
} as const;
