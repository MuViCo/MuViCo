import React, { useState, useEffect } from "react"
// import "./stripe.css"

const ProductDisplay = () => (
  <section>
    <div className="product">
      <img
        src="https://i.imgur.com/EHyR2nP.png"
        alt="The cover of Stubborn Attachments"
      />
      <div className="description">
        <h3>Stubborn Attachments</h3>
        <h5>$20.00</h5>
      </div>
    </div>
    <form
      action="http://localhost:8000/api/stripe/create-checkout-session"
      method="POST"
    >
      <button type="submit">Checkout</button>
    </form>
  </section>
)

const Message = ({ message }) => (
  <section>
    <p>{message}</p>
  </section>
)

const StripeComponent = () => {
  const [message, setMessage] = useState("")

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    console.log("Query Params:", query)

    if (query.get("success")) {
      setMessage("✅ Order placed! You will receive an email confirmation.")
    } else if (query.get("canceled")) {
      setMessage("❌ Order canceled. Please try again.")
    }
  }, [])

  return message ? <Message message={message} /> : <ProductDisplay />
}

export default StripeComponent
