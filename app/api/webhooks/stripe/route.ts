// ────────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ────────────────────────────────────────────────────────────────────────────────

import { headers } from "next/headers" // Next.js helper to read incoming HTTP headers (we need stripe-signature)
import { NextResponse } from "next/server" // Standard way to return HTTP responses from Next.js route handlers
import Stripe from "stripe" // Official Stripe SDK
import { client, writeClient } from "@/sanity/lib/client" // Your read-only and write-enabled Sanity clients
import { ORDER_BY_STRIPE_PAYMENT_ID_QUERY } from "@/sanity/queries/orders" // GROQ query to check if order already exists (idempotency)

// ────────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT & CONFIGURATION
// ────────────────────────────────────────────────────────────────────────────────

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined")
} // Fail fast in development/production if key is missing – prevents silent failures

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not defined")
} // Webhook secret is REQUIRED to verify that requests really come from Stripe

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover", // Locked API version – prevents breaking changes when Stripe updates
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET // Used to verify signature

// ────────────────────────────────────────────────────────────────────────────────
// MAIN WEBHOOK HANDLER (POST route)
// ────────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Read raw body – important! Stripe sends raw JSON, we need it for signature verification
  const body = await req.text()

  // Get all incoming headers
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  // Security: Stripe always sends this header when it's a real webhook
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    )
  }

  let event: Stripe.Event

  try {
    // This is THE MOST IMPORTANT security step
    // Verifies that:
    //   1. Request really comes from Stripe
    //   2. Body wasn't tampered with
    //   3. It's using your correct webhook secret
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Webhook signature verification failed:", message)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    )
    // Returning 400 tells Stripe: "this is invalid, don't retry"
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // EVENT SWITCH – decide what to do based on event type
  // ────────────────────────────────────────────────────────────────────────────────

  switch (event.type) {
    case "checkout.session.completed": {
      // This event fires when:
      //   - Payment was successful
      //   - Funds are captured (for payment mode)
      //   - Session status = "complete", payment_status = "paid"
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }

    default:
      // Log unknown events – good for debugging future events you might want to handle
      console.log(`Unhandled event type: ${event.type}`)
    // We still return 200 so Stripe doesn't retry unnecessarily
  }

  // Always return 200 quickly – tells Stripe "I received it, we're good"
  // If you return 5xx → Stripe retries many times (up to ~3 days)
  return NextResponse.json({ received: true })
}

// ────────────────────────────────────────────────────────────────────────────────
// BUSINESS LOGIC – called only on successful checkout
// ────────────────────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // payment_intent can be string or object – we want the ID
  const stripePaymentId = session.payment_intent as string

  try {
    // ──────────────── IDEMPOTENCY CHECK ────────────────
    // Very important: Stripe may send the same event multiple times (retries)
    // We check if we already created an order with this payment_intent
    const existingOrder = await client.fetch(ORDER_BY_STRIPE_PAYMENT_ID_QUERY, {
      stripePaymentId,
    })

    if (existingOrder) {
      console.log(
        `Webhook already processed for payment ${stripePaymentId}, skipping`,
      )
      return // Safe exit – no duplicate order
    }

    // ──────────────── EXTRACT METADATA ────────────────
    // These were set by you when creating the Checkout Session
    const {
      clerkUserId,
      userEmail,
      sanityCustomerId,
      productIds: productIdsString,
      quantities: quantitiesString,
    } = session.metadata ?? {}

    // Fail-safe: if metadata is missing → log and exit (don't create broken order)
    if (!clerkUserId || !productIdsString || !quantitiesString) {
      console.error("Missing metadata in checkout session")
      return
    }

    const productIds = productIdsString.split(",")
    const quantities = quantitiesString.split(",").map(Number)

    // ──────────────── GET LINE ITEMS FROM STRIPE ────────────────
    // We fetch again to get accurate prices paid (in case of discounts, taxes, etc.)
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

    // Build array in Sanity-compatible format
    const orderItems = productIds.map((productId, index) => ({
      _key: `item-${index}`, // Required unique key for array in Sanity
      product: {
        _type: "reference" as const,
        _ref: productId,
      },
      quantity: quantities[index],
      priceAtPurchase: lineItems.data[index]?.amount_total
        ? lineItems.data[index].amount_total / 100 // convert pence → pounds
        : 0,
    }))

    // Simple unique order number (timestamp + random)
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Shipping address – only if customer provided it
    const shippingAddress = session.customer_details?.address
    const address = shippingAddress
      ? {
          name: session.customer_details?.name ?? "",
          line1: shippingAddress.line1 ?? "",
          line2: shippingAddress.line2 ?? "",
          city: shippingAddress.city ?? "",
          postcode: shippingAddress.postal_code ?? "",
          country: shippingAddress.country ?? "",
        }
      : undefined

    // ──────────────── CREATE ORDER IN SANITY ────────────────
    const order = await writeClient.create({
      _type: "order",
      orderNumber,
      ...(sanityCustomerId && {
        // Only add reference if we have it
        customer: {
          _type: "reference",
          _ref: sanityCustomerId,
        },
      }),
      clerkUserId,
      email: userEmail ?? session.customer_details?.email ?? "",
      items: orderItems,
      total: (session.amount_total ?? 0) / 100,
      status: "paid",
      stripePaymentId,
      address,
      createdAt: new Date().toISOString(),
    })

    console.log(`Order created: ${order._id} (${orderNumber})`)

    // ──────────────── ATOMIC STOCK DECREASE ────────────────
    // Use transaction so either all succeed or none do
    await productIds
      .reduce(
        (tx, productId, i) =>
          tx.patch(productId, (p) => p.dec({ stock: quantities[i] })),
        writeClient.transaction(),
      )
      .commit()

    console.log(`Stock updated for ${productIds.length} products`)
  } catch (error) {
    console.error("Error handling checkout.session.completed:", error)
    throw error // ← Important: 500 → Stripe retries (good for transient DB errors)
    // If you want to swallow non-critical errors, change to return without throw
  }
}
