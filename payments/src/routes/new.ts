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
    console.log("==== [PAYMENT API HIT] ====");
    console.log("Request body:", req.body);
    console.log("Current user:", req.currentUser);


    const {orderId } = req.body;
    console.log(`[STEP 1] Fetching order with ID: ${orderId}`);

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
       console.error(`[ERROR] Order not found for ID: ${orderId}`);
      throw new NotFoundError();
    }
    console.log(`[STEP 2] Order fetched successfully:`, {
        orderId: order.id,
        userId: order.userId,
        price: order.price,
        status: order.status,
      });

    if (order.userId !== req.currentUser!.id) {
      console.error(`[ERROR] Unauthorized access by user ${req.currentUser!.id} for order ${order.id}`);
      throw new NotAuthorizedError();
    }

    if (order.status === OrderStatus.Cancelled) {
      console.error(`[ERROR] Attempt to pay for cancelled order: ${order.id}`);
      throw new BadRequestError('Cannot pay for a cancelled order');
    }

console.log(`[DEBUG] Stripe Key present:`, !!process.env.STRIPE_KEY);
    console.log(`[DEBUG] Stripe Key starts with:`, process.env.STRIPE_KEY?.substring(0, 10) || 'undefined');
    try {  
      const clientUrl = process.env.CLIENT_URL || "http://ticketingapp.duckdns.org";
console.log(`[STEP 3] Using client URL: ${clientUrl}`);

      console.log(`[STEP 4] Creating Stripe session for order ${order.id}`);
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
     
 console.log("success..",`${clientUrl}/orders`);
 console.log("cancel..",`${clientUrl}/orders/${order.id}?cancelled=true`);
     
console.log(`[STEP 5] Stripe session created successfully: ${session.id}`);
console.log(`[STEP 5.1] Session details:`, session);
console.log(`[DEBUG] Stripe session URL: ${session.url}`);
      const payment = Payment.build({
        orderId,
        stripeId: session.id,
      });
      await payment.save();
      console.log(`[STEP 6] Payment saved in DB: ${payment.id}`);
      
      await new PaymentCreatedPublisher(natsWrapper.client).publish({
        id: payment.id,
        orderId: payment.orderId,
        stripeId: payment.stripeId,
      });
    console.log(`[STEP 7] PaymentCreated event published for order ${order.id}`);
      res.status(201).send({ url: session.url });
      console.log(`[SUCCESS] Payment API completed for order ${order.id}`);

    } catch (err:any) {
      console.error("[FATAL ERROR in /api/payments]", err);
      if (err.raw) {
    console.error("Stripe raw error:", err.raw);  // Stripe API errors
  }
  if (err?.type || err?.message) {
        console.error('[STRIPE ERROR DETAILS]', {
          type: err.type,
          code: err.code,
          message: err.message,
        });
      }
      throw new BadRequestError("Payment session creation failed");
    }
  }
);

export { router as createChargeRouter };
