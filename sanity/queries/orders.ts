/**
 * ============================================================================
 * SANITY GROQ QUERY MASTER FILE (ORDERS EDITION)
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
 * count()    -> "Aggregation: Count the number of items in an array"
 */

import { defineQuery } from "next-sanity"

/**
 * ORDERS_BY_USER_QUERY
 * Use Case: Fetches a list of orders for the customer "My Orders" page.
 */
export const ORDERS_BY_USER_QUERY = defineQuery(`*[
  _type == "order"
  && clerkUserId == $clerkUserId
] | order(createdAt desc) {
  _id,
  orderNumber,
  total,
  status,
  createdAt,
  "itemCount": count(items),
  "itemNames": items[].product->name,
  "itemImages": items[].product->images[0].asset->url
}`)

/**
 * Explanation of Query
 
 export const ORDERS_BY_USER_QUERY = defineQuery(`*[
  _type == "order"                  // 1. FILTER: Search for 'order' documents
  && clerkUserId == $clerkUserId    // 2. MATCH: Belongs to the logged-in Clerk user
] | order(createdAt desc) {          // 3. SORT: Show newest orders first
  _id,
  orderNumber,
  total,
  status,
  createdAt,
  "itemCount": count(items),         // 4. AGGREGATE: Count how many items are in the array
  "itemNames": items[].product->name,// 5. ARRAY MAPPING: Get a list of all product names in this order
  "itemImages": items[].product->images[0].asset->url // 6. DEEP DEREFERENCE: Get first image URL for every product
}`)
*/

/**
 * ORDER_BY_ID_QUERY
 * Use Case: Detailed view of a single order, including shipping address and line items.
 */
export const ORDER_BY_ID_QUERY = defineQuery(`*[
  _type == "order"
  && _id == $id
][0] {
  _id,
  orderNumber,
  clerkUserId,
  email,
  items[]{
    _key,
    quantity,
    priceAtPurchase,
    product->{
      _id,
      name,
      "slug": slug.current,
      "image": images[0]{
        asset->{
          _id,
          url
        }
      }
    }
  },
  total,
  status,
  address{
    name,
    line1,
    line2,
    city,
    postcode,
    country
  },
  stripePaymentId,
  createdAt
}`)

/**
 * Explanation of Query
 
 export const ORDER_BY_ID_QUERY = defineQuery(`*[
  _type == "order" && _id == $id    // 1. FILTER: Find specific order by ID
][0] {                              // 2. SELECT: Return as a single Object { }
  _id,
  orderNumber,
  items[]{                          // 3. NESTED ARRAY: Open the items list
    _key,
    quantity,
    priceAtPurchase,                // 4. SNAPSHOT: Fetch the price saved at time of purchase
    product->{                      // 5. JOIN: Expand the product reference for details
      name,
      "image": images[0]{ asset->{ url } }
    }
  },
  address{                          // 6. OBJECT: Fetch nested shipping address
    city,
    postcode,
    country
  },
  stripePaymentId                   // 7. STRIPE LINK: Used for support/refunds
}`)
*/

/**
 * RECENT_ORDERS_QUERY
 * Use Case: Admin dashboard list showing the most recent activity.
 */
export const RECENT_ORDERS_QUERY = defineQuery(`*[
  _type == "order"
] | order(createdAt desc) [0...$limit] {
  _id,
  orderNumber,
  email,
  total,
  status,
  createdAt
}`)

/**
 * ORDER_BY_STRIPE_PAYMENT_ID_QUERY
 * Use Case: Preventing duplicate orders (Idempotency).
 * Checks if we already processed this Stripe transaction.
 */
export const ORDER_BY_STRIPE_PAYMENT_ID_QUERY = defineQuery(`*[
  _type == "order"
  && stripePaymentId == $stripePaymentId
][0]{ _id }`)

/**
 * ============================================================================
 * WHY THIS IS "SAFE AND LONG-LASTING"
 * ============================================================================
 *
 * 1. IDEMPOTENCY CHECK: ORDER_BY_STRIPE_PAYMENT_ID_QUERY is your shield.
 *    When Stripe webhooks fire twice (which they do!), this query allows
 *    your code to say "I've already seen this payment," preventing double-shipping.
 *
 * 2. PROJECTION ON ARRAYS: In ORDERS_BY_USER_QUERY, the syntax `items[].product->name`
 *    is a GROQ superpower. It creates an array of strings instantly without
 *    complex JavaScript mapping, keeping your frontend fast.
 *
 * 3. SNAPSHOT INTEGRITY: ORDER_BY_ID_QUERY fetches 'priceAtPurchase'.
 *    Because this value is stored on the Order (not the Product), your
 *    historical records remain accurate even if your store prices change.
 *
 * 4. ADMIN SCALABILITY: RECENT_ORDERS_QUERY uses a $limit variable.
 *    This ensures that even if you have 100,000 orders, your admin
 *    dashboard only fetches the top 5 or 10, keeping the UI snappy.
 */
