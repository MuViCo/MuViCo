const { STRIPE_SECRET_KEY, STRIPE_ENDPOINT_SECRET } = require("../utils/config")
const stripe = require("stripe")(STRIPE_SECRET_KEY)
const endpointSecret = STRIPE_ENDPOINT_SECRET
const express = require("express")
const router = express.Router()
const bodyParser = require("body-parser")

router.post("/", bodyParser.raw({type: "application/json"}), (request, response) => {
  let event = request.body

  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers["stripe-signature"]
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      )
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400)
    }
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      // console.log("✅ Payment succeeded!")
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break

      case "payment_intent.created":
        // console.log(`ℹ️ PaymentIntent created: ${event.data.object.id}`)
        // You could store this intent in a database if needed
        break

      case "payment_intent.payment_failed":
        // console.log("❌ PaymentIntent failed:", event.data.object.last_payment_error)
        // Handle payment failure (e.g., notify user, retry payment)
        break

      case "charge.failed":
        // console.log("⚠️ Charge failed:", event.data.object)
        // Handle failed charge (e.g., notify user)
        break

      case "charge.updated":
        // console.log("🔄 Charge updated:", event.data.object)
        // Handle updates to charges (e.g., update order status in database)
        break
    
      case "payment_method.attached":
        const paymentMethod = event.data.object
        // console.log(`💳 PaymentMethod attached: ${paymentMethod.id}`)
        break

    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`)
  }

  // Return a 200 response to acknowledge receipt of the event
  response.status(200).send()
})

module.exports = router
