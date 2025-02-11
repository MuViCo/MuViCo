// This is your test secret API key.
const stripe = require("stripe")(
  "sk_test_51QrLMpHQg7gLEDipprRIXhFFASgI7z16P2eAX9z5uTHK7Lep6So0i37nSf1MV5Wq0flsqxzU0IS9txc09foNINxG00f9ugY2I0"
)
const express = require("express")

const router = express.Router()

const YOUR_DOMAIN = "http://localhost:8000"

router.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: "prod_RkroQ18Fcen11F",
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
