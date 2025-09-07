const express = require("express");
const auth = require("../middleware/auth");
const logger = require("../config/logger");
const User = require("../models/User");

const router = express.Router();

// Stripe init
const stripeSecret = process.env.STRIPE_SECRET_KEY;
let stripe = null;
try {
  stripe = require("stripe")(stripeSecret || "");
} catch (_) {
  // Stripe opsiyonel init; gerçek ortamda SECRET zorunlu olmalı
}

// Create Checkout Session
router.post("/create-checkout-session", auth, async (req, res) => {
  try {
    if (!stripe)
      return res.status(500).json({ message: "Stripe yapılandırılmadı" });
    const { priceId, successUrl, cancelUrl } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: req.user.email,
      success_url: successUrl || `${req.headers.origin}/profile?sub=success`,
      cancel_url: cancelUrl || `${req.headers.origin}/pricing?sub=cancel`,
    });
    return res.json({ url: session.url });
  } catch (err) {
    logger.error("Stripe checkout error", { error: err.message });
    return res.status(500).json({ message: "Checkout başlatılamadı" });
  }
});

// Customer Portal
router.post("/customer-portal", auth, async (req, res) => {
  try {
    if (!stripe) {
      logger.warn("Stripe not configured", { userId: req.user.id });
      return res.status(500).json({ message: "Stripe yapılandırılmadı" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      logger.warn("User not found for customer portal", {
        userId: req.user.id,
      });
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (!user.subscription?.customerId) {
      logger.warn("No customer ID found", {
        userId: req.user.id,
        subscription: user.subscription,
      });
      return res.status(400).json({
        message: "Abonelik bulunamadı. Önce bir plan seçin.",
      });
    }

    logger.info("Creating customer portal session", {
      userId: req.user.id,
      customerId: user.subscription.customerId,
    });

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.subscription.customerId,
      return_url: `${req.headers.origin}/profile`,
    });

    logger.info("Customer portal session created", {
      userId: req.user.id,
      portalUrl: portal.url,
    });

    return res.json({ url: portal.url });
  } catch (err) {
    logger.error("Stripe portal error", {
      error: err.message,
      userId: req.user.id,
      stack: err.stack,
    });

    if (err.type === "StripeInvalidRequestError") {
      return res.status(400).json({
        message:
          "Geçersiz abonelik bilgisi. Lütfen destek ekibiyle iletişime geçin.",
      });
    }

    return res.status(500).json({
      message: "Portal açılamadı. Lütfen daha sonra tekrar deneyin.",
    });
  }
});

// Webhook (raw body gerekir - server.js'te bu route için raw middleware eklenmeli)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      if (!stripe) return res.status(500).send();
      const sig = req.headers["stripe-signature"];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      let event = req.body;
      if (endpointSecret) {
        try {
          event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      }

      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object;
          const customerId = sub.customer;
          const user = await User.findOne({
            "subscription.customerId": customerId,
          });
          if (user) {
            await User.updateOne(
              { _id: user._id },
              {
                $set: {
                  subscription: {
                    plan: sub.items?.data?.[0]?.price?.nickname || "pro",
                    status: sub.status,
                    customerId,
                    subscriptionId: sub.id,
                    currentPeriodEnd: new Date(sub.current_period_end * 1000),
                  },
                },
              }
            );
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object;
          const customerId = sub.customer;
          await User.updateOne(
            { "subscription.customerId": customerId },
            {
              $set: {
                subscription: {
                  plan: "free",
                  status: "canceled",
                  customerId,
                  subscriptionId: sub.id,
                  currentPeriodEnd: new Date(sub.current_period_end * 1000),
                },
              },
            }
          );
          break;
        }
        case "checkout.session.completed": {
          const session = event.data.object;
          // Müşteri oluşturulduysa customerId'i bağla
          if (session.customer_email && session.customer) {
            await User.updateOne(
              { email: session.customer_email },
              { $set: { "subscription.customerId": session.customer } }
            );
          }
          break;
        }
        default:
          break;
      }

      res.json({ received: true });
    } catch (err) {
      return res.status(500).send();
    }
  }
);

module.exports = router;
