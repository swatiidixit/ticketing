import { Subjects, Publisher, PaymentCreatedEvent } from '@ticketsd/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
