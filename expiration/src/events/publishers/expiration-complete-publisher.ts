import {
  Subjects,
  Publisher,
  ExpirationCompleteEvent,
} from '@ticketsd/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
