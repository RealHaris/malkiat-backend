export class DeleteListingCommand {
  constructor(
    public readonly payload: {
      id: string;
      actorUserId?: string;
      ownerId?: string;
    },
  ) {}
}
