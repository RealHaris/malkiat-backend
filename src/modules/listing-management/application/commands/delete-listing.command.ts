export class DeleteListingCommand {
  constructor(
    public readonly payload: {
      id: string;
      ownerId: string;
    },
  ) {}
}
