import { Subjects, Publisher, OrderCancelledEvent } from '@ticketsd/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
