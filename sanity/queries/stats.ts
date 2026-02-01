/**
 * ============================================================================
 * SANITY GROQ QUERY MASTER FILE (ANALYTICS & AI INSIGHTS)
 * ============================================================================
 *
 * QUICK LEGEND:
 * [*]          -> "Search everything"
 * count()      -> "Count total number of items"
 * math::sum()  -> "Calculate the total sum of a field"
 * in path()    -> "Check document path (used here to skip 'draft' versions)"
 * status in [] -> "Check if value matches any item in the list"
 * { "a": ... } -> "Object Projection: Create a custom JSON response"
 */

import { defineQuery } from "next-sanity"

/**
 * BASIC COUNTS
 * Use Case: Quick stats for dashboard headers.
 */
export const PRODUCT_COUNT_QUERY = defineQuery(`count(*[_type == "product"])`)
export const ORDER_COUNT_QUERY = defineQuery(`count(*[_type == "order"])`)

/**
 * TOTAL_REVENUE_QUERY
 * Use Case: Calculating the lifetime value of the store.
 */
export const TOTAL_REVENUE_QUERY = defineQuery(`math::sum(*[
  _type == "order"
  && status in ["paid", "shipped", "delivered"]
].total)`)

/**
 * Explanation of Revenue Query
 
 export const TOTAL_REVENUE_QUERY = defineQuery(`math::sum( // 1. AGGREGATE: Sum up values
  *[                                                      // 2. SEARCH: All documents
    _type == "order"                                      // 3. FILTER: Only orders
    && status in ["paid", "shipped", "delivered"]         // 4. VALIDATE: Only successful payments
  ].total                                                 // 5. TARGET: The 'total' price field
)`)
*/

/**
 * ORDERS_LAST_7_DAYS_QUERY
 * Use Case: AI analysis of recent sales trends.
 */
export const ORDERS_LAST_7_DAYS_QUERY = defineQuery(`*[
  _type == "order"
  && createdAt >= $startDate
  && !(_id in path("drafts.**"))
] | order(createdAt desc) {
  _id,
  orderNumber,
  total,
  status,
  createdAt,
  "itemCount": count(items),
  items[]{
    quantity,
    priceAtPurchase,
    "productName": product->name,
    "productId": product->_id
  }
}`)

/**
 * Explanation of Query
 
 export const ORDERS_LAST_7_DAYS_QUERY = defineQuery(`*[
  _type == "order"                  // 1. FILTER: Order documents
  && createdAt >= $startDate        // 2. TIME: Only since the variable date
  && !(_id in path("drafts.**"))    // 3. SAFETY: Exclude unpublished 'draft' edits
] | order(createdAt desc) {          // 4. SORT: Newest first
  _id,
  orderNumber,
  total,
  "itemCount": count(items),         // 5. COUNT: Number of line items
  items[]{                          // 6. NESTED: Details for AI trend analysis
    quantity,
    "productName": product->name     // 7. JOIN: Get name via product reference
  }
}`)
*/

/**
 * ORDER_STATUS_DISTRIBUTION_QUERY
 * Use Case: Pie charts or AI summaries of fulfillment health.
 */
export const ORDER_STATUS_DISTRIBUTION_QUERY = defineQuery(`{
  "paid": count(*[_type == "order" && status == "paid" && !(_id in path("drafts.**"))]),
  "shipped": count(*[_type == "order" && status == "shipped" && !(_id in path("drafts.**"))]),
  "delivered": count(*[_type == "order" && status == "delivered" && !(_id in path("drafts.**"))]),
  "cancelled": count(*[_type == "order" && status == "cancelled" && !(_id in path("drafts.**"))])
}`)

/**
 * REVENUE_BY_PERIOD_QUERY
 * Use Case: Comparing growth (e.g., This Month vs Last Month).
 */
export const REVENUE_BY_PERIOD_QUERY = defineQuery(`{
  "currentPeriod": math::sum(*[
    _type == "order"
    && status in ["paid", "shipped", "delivered"]
    && createdAt >= $currentStart
    && !(_id in path("drafts.**"))
  ].total),
  "previousPeriod": math::sum(*[
    _type == "order"
    && status in ["paid", "shipped", "delivered"]
    && createdAt >= $previousStart
    && createdAt < $currentStart
    && !(_id in path("drafts.**"))
  ].total),
  "currentOrderCount": count(*[
    _type == "order"
    && createdAt >= $currentStart
    && !(_id in path("drafts.**"))
  ]),
  "previousOrderCount": count(*[
    _type == "order"
    && createdAt >= $previousStart
    && createdAt < $currentStart
    && !(_id in path("drafts.**"))
  ])
}`)

/**
 * Explanation of Query
 
 export const REVENUE_BY_PERIOD_QUERY = defineQuery(`{ // 1. OBJECT: Create a custom response
  "currentPeriod": math::sum(*[                      // 2. SUM: Total for current time window
    _type == "order"
    && createdAt >= $currentStart                   // 3. PARAM: Start of current period
    && !(_id in path("drafts.**"))
  ].total),
  "previousPeriod": math::sum(*[                     // 4. SUM: Total for previous time window
    _type == "order"
    && createdAt >= $previousStart                  // 5. PARAM: Start of past period
    && createdAt < $currentStart                    // 6. PARAM: End of past period
    && !(_id in path("drafts.**"))
  ].total)
}`)
*/

/**
 * ============================================================================
 * WHY THIS IS "SAFE AND LONG-LASTING" (Deep Detail)
 * ============================================================================
 *
 * 1. DRAFT EXCLUSION (!(_id in path("drafts.**"))):
 *    - THE SYSTEM: Sanity uses a "Content Lake." Documents are not just rows;
 *      they have paths. Drafts are stored with the prefix "drafts.".
 *    - THE DANGER: If your AI agent asks "How much money did we make?",
 *      and you are currently editing a £1,000 order in the CMS, the AI will
 *      count both the saved £1,000 and the draft £1,000.
 *    - THE SAFETY: This line ensures only "Live/Published" data is used
 *      for your business logic and AI analysis.
 *
 * 2. EXCLUSIVE SLICING ([0...$limit]):
 *    - PERFORMANCE: Loading 10,000 items crashes browsers. Slicing forces
 *      the database to only send what you need.
 *    - ACCURACY: Using three dots (0...5) is the industry standard for
 *      "Give me 5 items." Using two dots (0..5) would actually give you 6
 *      items (0,1,2,3,4,5), which often causes "Off-by-one" layout bugs.
 *
 * 3. SERVER-SIDE MATH (math::sum):
 *    - EFFICIENCY: If you have 50,000 orders, you don't want to download
 *      all of them just to add up the price. math::sum does the math
 *      inside the high-performance Sanity engine and sends you one single
 *      number. This saves massive amounts of data and battery.
 *
 * 4. AI-READINESS:
 *    - AI models are excellent at reading JSON, but they struggle with
 *      calculating math across thousands of rows. By doing the math
 *      IN THE QUERY, you give the AI "Processed Intelligence."
 *      The AI can focus on "Why is revenue down?" instead of "What is
 *      the total revenue?"
 *
 * 5. PARAMETERIZATION ($slug, $searchQuery):
 *    - SECURITY: This prevents "Prompt Injection" or "Query Injection."
 *      If a user types malicious code into your search bar, Sanity
 *      treats it as a simple string, not a command.
 */
