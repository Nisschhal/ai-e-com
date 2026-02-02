"use server"
import Stripe from "stripe"
import { client, writeClient } from "@/sanity/lib/client"
import { CUSTOMER_BY_EMAIL_QUERY } from "@/sanity/queries/customers"

// Stripe instance (custom setup, not built-in)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover", // Specific Stripe API version (future-proofing).
})

export async function getOrCreateStripeCustomer(
  email: string, // Required param: User's email.
  name: string, // Required param: User's name.
  clerkUserId: string, // Required param: Clerk user ID for metadata.
): Promise<{ stripeCustomerId: string; sanityCustomerId: string }> {
  // 1. Check Sanity first (custom logic using Sanity's client.fetch – not Stripe).
  const existingCustomer = await client.fetch(CUSTOMER_BY_EMAIL_QUERY, {
    email,
  })

  if (existingCustomer?.stripeCustomerId) {
    return {
      stripeCustomerId: existingCustomer.stripeCustomerId,
      sanityCustomerId: existingCustomer._id,
    }
  }

  // 2. Check Stripe (Stripe API method: stripe.customers.list – built-in Stripe method).
  // Params: email (filter), limit:1 (optional, but efficient).
  const existingStripeCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  let stripeCustomerId: string

  if (existingStripeCustomers.data.length > 0) {
    stripeCustomerId = existingStripeCustomers.data[0].id // Stripe returns array; grab first.
  } else {
    // Create new in Stripe (Stripe API method: stripe.customers.create – built-in).
    // Params: email, name (required for customer), metadata (optional: custom data like clerkUserId).
    const newStripeCustomer = await stripe.customers.create({
      email,
      name,
      metadata: { clerkUserId },
    })
    stripeCustomerId = newStripeCustomer.id
  }

  // 3. Sync to Sanity
  if (existingCustomer) {
    // Update existing (Sanity API: writeClient.patch – Sanity method, not Stripe).
    // Params: _id (document ID), set (updates fields).
    await writeClient
      .patch(existingCustomer._id)
      .set({ stripeCustomerId, clerkUserId, name })
      .commit()
    return { stripeCustomerId, sanityCustomerId: existingCustomer._id }
  }

  // Create new in Sanity (Sanity API: writeClient.create – Sanity method).
  // Params: _type (your schema type), fields like email, name, etc.
  const newSanityCustomer = await writeClient.create({
    _type: "customer", // Your Sanity schema type.
    email,
    name,
    clerkUserId,
    stripeCustomerId,
    createdAt: new Date().toISOString(), // Custom timestamp.
  })

  return { stripeCustomerId, sanityCustomerId: newSanityCustomer._id }
}
