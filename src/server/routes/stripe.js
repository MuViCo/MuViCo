// This is your test secret API key.
const stripe = require("stripe")(require("../utils/config").STRIPE_SECRET_KEY) 
const express = require("express")

const router = express.Router()

const YOUR_DOMAIN = "http://localhost:3000/home"

router.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: "price_1QrccDHQg7gLEDipGHTBG70X",
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${YOUR_DOMAIN}?success=true`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
  })

  res.redirect(303, session.url)
})

module.exports = router
