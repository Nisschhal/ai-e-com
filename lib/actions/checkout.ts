"use server"

import { auth, currentUser } from "@clerk/nextjs/server" // Clerk auth functions (built-in Clerk).
import Stripe from "stripe"
import { client } from "@/sanity/lib/client"
import { PRODUCTS_BY_IDS_QUERY } from "@/sanity/queries/products"
import { getOrCreateStripeCustomer } from "./customer" // Your custom function.

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
})

// Types
interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface CheckoutResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Creates a Stripe Checkout Session from cart items
 * Validates stock and prices against Sanity before creating session
 */
export async function createCheckoutSession(
  items: CartItem[],
): Promise<CheckoutResult> {
  try {
    // 1. Verify user is authenticated
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" }
    }

    // 2. Validate cart is not empty
    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" }
    }

    // 3. Fetch current product data from Sanity to validate prices/stock
    const productIds = items.map((item) => item.productId)
    const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
      ids: productIds,
    })

    // 4. Validate each item (custom loop: check existence, stock).
    const validationErrors: string[] = []
    const validatedItems: {
      product: (typeof products)[number]
      quantity: number
    }[] = []

    for (const item of items) {
      const product = products.find(
        (p: { _id: string }) => p._id === item.productId,
      )

      if (!product) {
        validationErrors.push(`Product "${item.name}" is no longer available`)
        continue
      }

      if ((product.stock ?? 0) === 0) {
        validationErrors.push(`"${product.name}" is out of stock`)
        continue
      }

      if (item.quantity > (product.stock ?? 0)) {
        validationErrors.push(
          `Only ${product.stock} of "${product.name}" available`,
        )
        continue
      }

      validatedItems.push({ product, quantity: item.quantity })
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") }
    }

    // 5. Create Stripe line items (custom mapping).
    // Each line item uses Stripe's format: price_data (built-in param for dynamic pricing).
    // Params: currency ("gbp" – your choice), product_data (name, images, metadata – optional), unit_amount (price * 100 for pence – required for accuracy).
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      validatedItems.map(({ product, quantity }) => ({
        price_data: {
          currency: "gbp",
          product_data: {
            name: product.name ?? "Product",
            images: product.image?.asset?.url ? [product.image.asset.url] : [],
            metadata: {
              productId: product._id,
            },
          },
          unit_amount: Math.round((product.price ?? 0) * 100), // Convert to pence
        },
        quantity,
      }))

    // 6. Get or create Stripe customer
    const userEmail = user.emailAddresses[0]?.emailAddress ?? ""
    const userName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail

    const { stripeCustomerId, sanityCustomerId } =
      await getOrCreateStripeCustomer(userEmail, userName, userId)

    // 7. Prepare metadata for webhook
    const metadata = {
      clerkUserId: userId,
      userEmail,
      sanityCustomerId,
      productIds: validatedItems.map((i) => i.product._id).join(","),
      quantities: validatedItems.map((i) => i.quantity).join(","),
    }

    // 8. Create session (Stripe API: stripe.checkout.sessions.create – built-in method).
    // Priority: NEXT_PUBLIC_BASE_URL > Vercel URL > localhost

    // Key params (all built-in Stripe):
    // - mode: "payment" (one-time payment; alternatives like "subscription").
    // - payment_method_types: ["card"] (accepts cards; can add more).
    // - line_items: The array from step 5 (required).
    // - customer: stripeCustomerId (attaches to existing customer – optional but recommended).
    // - shipping_address_collection: { allowed_countries: [...] } (built-in: collects shipping; countries are your choice).
    // - metadata: Your custom data (optional).
    // - success_url/cancel_url: Redirects after payment (built-in; uses {CHECKOUT_SESSION_ID} placeholder).
    // Base URL logic: Custom fallback for dev/prod (env vars).
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer: stripeCustomerId,
      shipping_address_collection: {
        allowed_countries: [
          "GB", // United Kingdom
          "US", // United States
          "CA", // Canada
          "AU", // Australia
          "NZ", // New Zealand
          "IE", // Ireland
          "DE", // Germany
          "FR", // France
          "ES", // Spain
          "IT", // Italy
          "NL", // Netherlands
          "BE", // Belgium
          "AT", // Austria
          "CH", // Switzerland
          "SE", // Sweden
          "NO", // Norway
          "DK", // Denmark
          "FI", // Finland
          "PT", // Portugal
          "PL", // Poland
          "CZ", // Czech Republic
          "GR", // Greece
          "HU", // Hungary
          "RO", // Romania
          "BG", // Bulgaria
          "HR", // Croatia
          "SI", // Slovenia
          "SK", // Slovakia
          "LT", // Lithuania
          "LV", // Latvia
          "EE", // Estonia
          "LU", // Luxembourg
          "MT", // Malta
          "CY", // Cyprus
          "JP", // Japan
          "SG", // Singapore
          "HK", // Hong Kong
          "KR", // South Korea
          "TW", // Taiwan
          "MY", // Malaysia
          "TH", // Thailand
          "IN", // India
          "AE", // United Arab Emirates
          "SA", // Saudi Arabia
          "IL", // Israel
          "ZA", // South Africa
          "BR", // Brazil
          "MX", // Mexico
          "AR", // Argentina
          "CL", // Chile
          "CO", // Colombia
        ],
      },
      metadata,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
    })

    return { success: true, url: session.url ?? undefined }
  } catch (error) {
    console.error("Checkout error:", error)
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    }
  }
}

/**
 * Retrieves a checkout session by ID (for success page)
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    // 1. Auth check (Clerk: auth()).
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Not authenticated" }
    }

    // 2. Retrieve session (Stripe API: stripe.checkout.sessions.retrieve – built-in).
    // Params: sessionId (required), expand: ["line_items", "customer_details"] (optional: fetches nested data).
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details"],
    })

    // 3. Verify ownership (custom: check metadata.clerkUserId).
    // Verify the session belongs to this user
    if (session.metadata?.clerkUserId !== userId) {
      return { success: false, error: "Session not found" }
    }

    // 4. Return mapped data (custom: extracts fields like amountTotal – all from Stripe response).
    return {
      success: true,
      session: {
        id: session.id,
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        amountTotal: session.amount_total,
        paymentStatus: session.payment_status,
        shippingAddress: session.customer_details?.address,
        lineItems: session.line_items?.data.map((item) => ({
          name: item.description,
          quantity: item.quantity,
          amount: item.amount_total,
        })),
      },
    }
  } catch (error) {
    console.error("Get session error:", error)
    return { success: false, error: "Could not retrieve order details" }
  }
}
