/**
 * ============================================================================
 * SANITY GROQ QUERY MASTER FILE – COMPLETE & FULLY DETAILED
 * ============================================================================
 *
 * QUICK LEGEND:
 * [*]             -> "Search everything" (The Global Selector – starts most queries)
 * [_type ==]      -> "Filter" (The Funnel to narrow results – keeps only matching documents)
 * { ... }         -> "Projection" (The JSON shape you want back – decides which fields are returned)
 * "key": value    -> "Mapping/Flattening" (Rename a field or pull nested data into a cleaner name)
 * asset->         -> "Dereference" (Follow the reference/link to get the actual image/file data)
 * [0]             -> "First Item" (Return one object instead of an array/list)
 * !               -> "NOT" (Invert the logic – example: !(_type == "product"))
 * && / ||         -> "AND / OR" (Combine multiple filters – && = both must be true, || = at least one)
 *
 * --- THE DOTS (Slicing / Limiting) ---
 * [0..5]          -> "INCLUSIVE" (Includes 0,1,2,3,4,5 → 6 items total)
 * [0...5]         -> "EXCLUSIVE" (Includes 0,1,2,3,4 → stops before 5 → 5 items total)
 *                 -> Most common for pagination: use ... (exclusive upper bound)
 *
 * --- THE SEARCH ---
 * match + "*"     -> "Wildcard / Prefix search" ("chair*" matches chair, chairs, chair cover...)
 * score()         -> "Relevance" (Calculates how well a document matches the search – adds _score field)
 * boost(…, N)     -> "Make this match more important" (multiplies points – name usually boosted higher)
 */

/**
 * DEEP EXPLANATION: THE "ARROW" (->)
 *
 * In database:        category: { _ref: "cat-abc123", _type: "reference" }
 * After dereference:  category->{ title, slug.current }
 * → "Follow this reference and get real data from the linked document"
 */

/**
 * DEEP EXPLANATION: OPTIONAL FILTER PATTERN
 *
 * Very common pattern: ($param == "" || realCondition)
 * When $param is empty string "" → first part true → whole OR = true → filter is ignored
 * When $param has value     → first part false → must satisfy realCondition
 * → Makes every filter optional without writing separate queries
 */

/**
 * DEEP EXPLANATION: RELEVANCE SCORING (score + boost)
 *
 * score(…)               → GROQ adds temporary field _score to every document (runtime only)
 * boost(expression, N)   → If expression true → add N × (number of matches) points
 * → Example: boost(name match …, 3) means title match = 3× more important than description
 * → order(_score desc, name asc) → best matches first, then alphabetical if scores tie
 * → _score disappears after query unless you include it in projection {…, _score}
 * → Returns ALL matching documents — only changes ORDER (not filtering)
 */

import { defineQuery } from "next-sanity"
import { LOW_STOCK_THRESHOLD } from "@/lib/constants/stock"

// ============================================
// SHARED FRAGMENTS (The "Lego Blocks")
// ============================================

/**
 * PRODUCT_FILTER_CONDITIONS
 * Reusable block containing all optional filters
 * Every condition uses ($var == default || actual match) pattern
 * → empty/default values make the filter inactive
 */
const PRODUCT_FILTER_CONDITIONS = `
  _type == "product"                                                      // 1. BASE FILTER: only products
  && ($categorySlug == "" || category->slug.current == $categorySlug)     // 2. OPTIONAL: category
  && ($color == ""        || color == $color)                             // 3. OPTIONAL: color
  && ($material == ""     || material == $material)                       // 4. OPTIONAL: material
  && ($minPrice == 0      || price >= $minPrice)                          // 5. OPTIONAL: min price (0 = no limit)
  && ($maxPrice == 0      || price <= $maxPrice)                          // 6. OPTIONAL: max price (0 = no limit)
  && ($searchQuery == ""  || name match $searchQuery + "*" || description match $searchQuery + "*")  // 7. OPTIONAL: search
  && ($inStock == false   || stock > 0)                                   // 8. OPTIONAL: in-stock only
`

/**
 * FILTERED_PRODUCT_PROJECTION
 * Standard shape returned by most list queries
 * Limits images to first 4 → perfect for card hover preview
 */
const FILTERED_PRODUCT_PROJECTION = `{
  _id,
  name,
  "slug": slug.current,
  price,
  "images": images[0...4]{           // 1. LIMIT: max 4 images (exclusive)
    _key,                            // 2. Needed for React list rendering
    asset->{ _id, url }              // 3. Dereference to get real image URL
  },
  category->{                        // 4. Expand category reference
    _id, title, "slug": slug.current
  },
  material,
  color,
  stock
}`

/**
 * RELEVANCE_SCORE
 * Reusable scoring block for relevance sort
 * Title matches are 3× more valuable than description matches
 */
const RELEVANCE_SCORE = `score(
  boost(name match $searchQuery + "*", 3),        // Title = very important
  boost(description match $searchQuery + "*", 1)  // Description = secondary
)`

// ============================================
// PRODUCTION QUERIES – FULL BREAKDOWN FOR EVERY SINGLE QUERY
// ============================================

/**
 * ALL_PRODUCTS_QUERY
 * → Purpose: Get literally every product in the store (no filters at all)
 * → Used for: full catalog view, admin export, sitemap generation, initial data loads
 * → Returns full data (all images, all fields)
 */
export const ALL_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"                    // 1. FILTER: only product documents
] | order(name asc) {                   // 2. SORT: alphabetical by name
  _id,
  name,
  "slug": slug.current,                 // 3. Rename: make slug a clean string
  description,
  price,
  "images": images[]{                   // 4. ALL images (no limit)
    _key,
    asset->{ _id, url },
    hotspot
  },
  category->{                           // 5. Expand category reference
    _id, title, "slug": slug.current
  },
  material, color, dimensions,
  stock, featured, assemblyRequired
}`)

/**
 * FEATURED_PRODUCTS_QUERY
 * → Purpose: Homepage featured carousel
 * → Only products marked as featured AND in stock
 * → Limited to first 6 results
 */
export const FEATURED_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"                    // 1. Base type filter
  && featured == true                   // 2. Must be marked featured
  && stock > 0                          // 3. Must be in stock
] | order(name asc) [0...6] {           // 4. Sort A-Z → take first 6 (exclusive)
  _id, name, "slug": slug.current,
  description, price,
  "images": images[]{ _key, asset->{ _id, url }, hotspot },
  category->{ _id, title, "slug": slug.current },
  stock
}`)

/**
 * PRODUCTS_BY_CATEGORY_QUERY
 * → Purpose: Dedicated category page (simpler than full filter query)
 * → Only one hard filter: category slug
 * → Single image only (list / grid view)
 */
export const PRODUCTS_BY_CATEGORY_QUERY = defineQuery(`*[
  _type == "product"                    // 1. Base filter
  && category->slug.current == $categorySlug   // 2. Exact category match
] | order(name asc) {                   // 3. SORT: alphabetical
  _id, name, "slug": slug.current,
  price,
  "image": images[0]{                   // 4. Only first image
    asset->{ _id, url }, hotspot
  },
  category->{ _id, title, "slug": slug.current },
  material, color, stock
}`)

/**
 * PRODUCT_BY_SLUG_QUERY
 * → Purpose: Single product detail page
 * → Finds exactly one document by unique slug
 * → [0] returns object instead of array
 */
export const PRODUCT_BY_SLUG_QUERY = defineQuery(`*[
  _type == "product"                    // 1. FILTER: only products
  && slug.current == $slug              // 2. MATCH: exact slug from URL
][0] {                                  // 3. SELECT: first (and only) result as object
  _id, name, "slug": slug.current,
  description, price,
  "images": images[]{                   // 4. ARRAY: all images for gallery
    _key,
    asset->{ _id, url },
    hotspot
  },
  category->{                           // 5. JOIN: full category data
    _id, title, "slug": slug.current
  },
  material, color, dimensions,
  stock, featured, assemblyRequired
}`)

/**
 * SEARCH_PRODUCTS_QUERY
 * → Purpose: Pure keyword search (no other filters like category/color/price)
 * → Returns _score in output (useful for debug or showing relevance %)
 * → Pure relevance sort (no name tie-breaker)
 */
export const SEARCH_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && (                                  // 1. Must match name OR description
    name match $searchQuery + "*"
    || description match $searchQuery + "*"
  )
] | score(                               // 2. Calculate relevance
  boost(name match $searchQuery + "*", 3),
  boost(description match $searchQuery + "*", 1)
) | order(_score desc) {                // 3. Best match first
  _id, _score,                          // 4. Include score in result
  name, "slug": slug.current,
  price,
  "image": images[0]{ asset->{ _id, url }, hotspot },
  category->{ _id, title, "slug": slug.current },
  material, color, stock
}`)

/**
 * FILTER_PRODUCTS_BY_NAME_QUERY
 * → Purpose: Default shop listing view (sorted A–Z)
 * → Applies all optional filters
 * → Optimized for product cards (4 images max)
 */
export const FILTER_PRODUCTS_BY_NAME_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}]        // 1. Apply all optional filters
  | order(name asc)                       // 2. SORT: alphabetical
  ${FILTERED_PRODUCT_PROJECTION}`, // 3. Standard card projection
)

/**
 * FILTER_PRODUCTS_BY_PRICE_ASC_QUERY
 * → Purpose: Shop listing when user selects "Price: Low to High"
 * → Applies all optional filters
 * → Sorts from cheapest to most expensive
 * → Same card projection (4 images max)
 */
export const FILTER_PRODUCTS_BY_PRICE_ASC_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}]               // 1. All optional filters (category, color, price range, search, stock…)
  | order(price asc)                        // 2. SORT: lowest price first (ascending)
  ${FILTERED_PRODUCT_PROJECTION}`, // 3. Card-friendly output (max 4 images)
)

/**
 * FILTER_PRODUCTS_BY_PRICE_DESC_QUERY
 * → Purpose: Shop listing when user selects "Price: High to Low"
 * → Same filters, reversed price sort
 * → Most expensive products appear first
 */
export const FILTER_PRODUCTS_BY_PRICE_DESC_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}]               // 1. Same optional filters
  | order(price desc)                       // 2. SORT: highest price first (descending)
  ${FILTERED_PRODUCT_PROJECTION}`, // 3. Consistent card shape
)

/**
 * FILTER_PRODUCTS_BY_RELEVANCE_QUERY
 * → Purpose: Search + filters + "Relevance" sort
 * → Most intelligent / Google-like sorting
 * → Applies filters → calculates score → best matches first
 * → Tie-breaker: alphabetical name
 */
export const FILTER_PRODUCTS_BY_RELEVANCE_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}]               // 1. All optional filters still apply
  | ${RELEVANCE_SCORE}                      // 2. Compute relevance score
                                            //    → title matches 3× stronger
                                            //    → _score added automatically (runtime)
  | order(_score desc, name asc)            // 3. Best score first → then A-Z on ties
  ${FILTERED_PRODUCT_PROJECTION}`, // 4. Same card projection
)

/**
 * PRODUCTS_BY_IDS_QUERY
 * → Purpose: Cart, checkout, order history, related products
 * → Fast bulk lookup by array of document IDs
 * → Minimal fields (only commerce essentials)
 */
export const PRODUCTS_BY_IDS_QUERY = defineQuery(`*[
  _type == "product"
  && _id in $ids                        // 1. Match any ID in array
] {
  _id, name, "slug": slug.current,
  price,
  "image": images[0]{ asset->{ _id, url }, hotspot },
  stock                                 // 2. Critical for availability check
}`)

/**
 * LOW_STOCK_PRODUCTS_QUERY
 * → Purpose: Admin / inventory alert – items running low
 * → Only positive stock ≤ threshold
 * → Sorted by urgency (lowest stock first)
 */
export const LOW_STOCK_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"                    // 1. Base filter
  && stock > 0                          // 2. Still available
  && stock <= ${LOW_STOCK_THRESHOLD}    // 3. Below threshold (e.g. 5)
] | order(stock asc) {                  // 4. SORT: lowest stock first
  _id, name, "slug": slug.current,
  stock,
  "image": images[0]{                   // 5. Only first image
    asset->{ _id, url }
  }
}`)

/**
 * OUT_OF_STOCK_PRODUCTS_QUERY
 * → Purpose: Admin view – review / manage zero-stock items
 * → Simple list, sorted alphabetically
 */
export const OUT_OF_STOCK_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && stock == 0                         // 1. Only out-of-stock
] | order(name asc) {                   // 2. SORT: A-Z
  _id, name, "slug": slug.current,
  "image": images[0]{ asset->{ _id, url } }
}`)

/**
 * AI_SEARCH_PRODUCTS_QUERY
 * → Purpose: Feed data to AI shopping assistant / voice / chat
 * → Searches name, description AND category title
 * → Rich fields (description, dimensions) for reasoning
 * → Hard limit 20 results for speed
 */
export const AI_SEARCH_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"                    // 1. Base filter
  && (                                  // 2. Broad search condition
    $searchQuery == ""                  //   - no query = return all
    || name match $searchQuery + "*"
    || description match $searchQuery + "*"
    || category->title match $searchQuery + "*"  // extra: category names
  )
  && ($categorySlug == "" || category->slug.current == $categorySlug)
  && ($material == "" || material == $material)
  && ($color == "" || color == $color)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
] | order(name asc) [0...20] {           // 3. SORT A-Z + limit to 20
  _id, name, "slug": slug.current,
  description, price,
  "image": images[0]{ asset->{ _id, url } },
  category->{ _id, title, "slug": slug.current },
  material, color, dimensions,
  stock, featured, assemblyRequired
}`)

/**
 * ============================================================================
 * FINAL SUMMARY – WHICH QUERY TO USE WHEN?
 * ============================================================================
 *
 * • Full catalog / admin export            → ALL_PRODUCTS_QUERY
 * • Homepage featured carousel             → FEATURED_PRODUCTS_QUERY
 * • Single product detail page             → PRODUCT_BY_SLUG_QUERY
 * • Category-specific page                 → PRODUCTS_BY_CATEGORY_QUERY
 * • Shop listing default (A-Z)             → FILTER_PRODUCTS_BY_NAME_QUERY
 * • Shop + price low→high                  → FILTER_PRODUCTS_BY_PRICE_ASC_QUERY
 * • Shop + price high→low                  → FILTER_PRODUCTS_BY_PRICE_DESC_QUERY
 * • Shop + search + relevance sort         → FILTER_PRODUCTS_BY_RELEVANCE_QUERY
 * • Pure keyword search (no filters)       → SEARCH_PRODUCTS_QUERY
 * • Cart / checkout / bulk lookup          → PRODUCTS_BY_IDS_QUERY
 * • Admin – low stock alert                → LOW_STOCK_PRODUCTS_QUERY
 * • Admin – out of stock list              → OUT_OF_STOCK_PRODUCTS_QUERY
 * • AI assistant / voice / chat search     → AI_SEARCH_PRODUCTS_QUERY
 */
