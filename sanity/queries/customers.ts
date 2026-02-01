/**
 * ============================================================================
 * SANITY GROQ QUERY MASTER FILE
 * ============================================================================
 *
 * QUICK LEGEND:
 * [*]        -> "Search everything in my database"
 * [_type ==] -> "Filter: Only show me documents of this specific type"
 * { ... }    -> "Projection: Only download these specific fields (saves bandwidth)"
 * "key": val -> "Mapping: Rename a field or extract a nested value"
 * asset->    -> "Dereferencing: Follow the ID link to get the actual file data"
 * | order()  -> "Sorting: Arrange the results (asc = A-Z, desc = Z-A)"
 * [0]        -> "Single Selection: Give me one object instead of a list"
 * $slug      -> "Parameter: A variable passed from your frontend code (Safe/Secure)"
 */

import { defineQuery } from "next-sanity"

/**
 * CUSTOMER_BY_EMAIL_QUERY
 * Use Case: Checking if a user exists in Sanity during login or signup.
 */
export const CUSTOMER_BY_EMAIL_QUERY = defineQuery(`*[
  _type == "customer"
  && email == $email
][0] {
  _id,
  email,
  name,
  clerkUserId,
  stripeCustomerId,
  createdAt
}`)

/**
 * Explanation of Query
 
 export const CUSTOMER_BY_EMAIL_QUERY = defineQuery(`*[ // 1. Global Selector: Search all documents
  _type == "customer" // 2. Filter: Only look at 'customer' documents
  && email == $email  // 3. Match: Find the one with this specific email variable
][0] {                // 4. Single Selection: Return the customer as an Object { }
  _id,                // 5. ID: The Sanity document unique ID
  email,              // 6. Field: The user's email address
  name,               // 7. Field: The user's full name
  clerkUserId,        // 8. Auth Bridge: The link to the Clerk Authentication record
  stripeCustomerId,   // 9. Payment Bridge: The link to the Stripe Payment record
  createdAt           // 10. Metadata: When this customer was first created
}`)
*/

/**
 * CUSTOMER_BY_STRIPE_ID_QUERY
 * Use Case: Finding a customer when a Stripe Webhook sends a payment update.
 */
export const CUSTOMER_BY_STRIPE_ID_QUERY = defineQuery(`*[
  _type == "customer"
  && stripeCustomerId == $stripeCustomerId
][0] {
  _id,
  email,
  name,
  clerkUserId,
  stripeCustomerId,
  createdAt
}`)

/**
 * Explanation of Query
 
 export const CUSTOMER_BY_STRIPE_ID_QUERY = defineQuery(`*[ // 1. Global Selector: Search all documents
  _type == "customer"                   // 2. Filter: Only look at 'customer' documents
  && stripeCustomerId == $stripeCustomerId // 3. Match: Find the one with this Stripe ID
][0] {                                  // 4. Single Selection: Return result as an Object { }
  _id,                                  // 5. ID: The Sanity document unique ID
  email,
  name,
  clerkUserId,
  stripeCustomerId,
  createdAt
}`)
*/

/**
 * ============================================================================
 * WHY THIS IS "SAFE AND LONG-LASTING"
 * ============================================================================
 *
 * 1. IDENTITY BRIDGING: These queries act as the "Glue" between Clerk (Auth),
 *    Stripe (Payments), and Sanity (Data). It ensures all three systems
 *    always point to the correct person.
 *
 * 2. WEBHOOK READINESS: By querying with $stripeCustomerId, your backend can
 *    instantly find the correct user when Stripe sends a "Payment Success"
 *    signal, making your order fulfillment 100% automated and safe.
 *
 * 3. NO DUPLICATES: Using [0] ensures that your frontend never has to deal
 *    with a list of users. It gets one specific profile, which prevents
 *    bugs in the checkout flow.
 *
 * 4. SECURITY: Using $email and $stripeCustomerId parameters prevents
 *    malicious users from trying to query other customers' private data.
 */
