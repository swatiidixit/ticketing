import { Publisher, OrderCreatedEvent, Subjects } from '@ticketsd/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
