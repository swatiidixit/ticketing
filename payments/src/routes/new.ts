import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  requireAuth,
  validateRequest,
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
} from '@ticketsd/common';
import { stripe } from '../stripe';
import { Order } from '../models/order';
import { Payment } from '../models/payment';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post(
  '/api/payments',
  requireAuth,
  [body('orderId').not().isEmpty()],
  validateRequest,
  async (req: Request, res: Response) => {

    const {orderId } = req.body;

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError();
    }

    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError('Cannot pay for a cancelled order');
    }


    try {  
      const clientUrl = process.env.CLIENT_URL || "http://ticketing.dev";

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `Order ${order.id}`,
              },
              unit_amount: order.price * 100,
            },
            quantity: 1,
          },
        ],
        success_url: `${clientUrl}/orders`,
        cancel_url: `${clientUrl}/orders/${order.id}?cancelled=true`,
      });

      const payment = Payment.build({
        orderId,
        stripeId: session.id,
      });
      await payment.save();
      
      await new PaymentCreatedPublisher(natsWrapper.client).publish({
        id: payment.id,
        orderId: payment.orderId,
        stripeId: payment.stripeId,
      });
    
      res.status(201).send({ url: session.url });

    } catch (err) {
      throw new BadRequestError("Payment session creation failed");
    }
  }
);

export { router as createChargeRouter };
