import { Publisher, Subjects, TicketUpdatedEvent } from '@ticketsd/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}
