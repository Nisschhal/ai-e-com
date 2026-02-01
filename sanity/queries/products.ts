/**
 * ============================================================================
 * SANITY GROQ QUERY MASTER FILE
 * ============================================================================
 *
 * QUICK LEGEND:
 * [*]             -> "Search everything" (The Global Selector)
 * [_type ==]      -> "Filter" (The Funnel to narrow results)
 * { ... }         -> "Projection" (The JSON shape you want back)
 * "key": value    -> "Mapping/Flattening" (Rename a field or pull nested data)
 * asset->         -> "Dereference" (Follow the 'Link' to get the actual file)
 * [0]             -> "First Item" (Return one Object instead of a List)
 * !               -> "NOT" (Invert the logic)
 * && / ||         -> "AND / OR" (Combine multiple filters)
 *
 * --- THE DOTS (Slicing) ---
 * [0..5]          -> "INCLUSIVE" (Includes 0, 1, 2, 3, 4, AND 5. Total = 6 items)
 * [0...5]         -> "EXCLUSIVE" (Includes 0, 1, 2, 3, 4. Stops BEFORE 5. Total = 5 items)
 *
 * --- THE SEARCH ---
 * match + "*"     -> "Wildcard" (Finds partial text: "Table*" matches "Tables")
 * score()         -> "Relevance" (Ranks results by how well they match)
 */

/**
 * DEEP EXPLANATION: THE "ARROW" (->)
 *
 * Standard Data: { "category": "cat_123" } (Just a useless ID string)
 * Dereferenced:  category-> { title }     (Follows ID to get the actual Name)
 *
 * Think of it as: "Go to the document this ID points to and open it."
 */

/**
 * DEEP EXPLANATION: THE "DOTS" (Inclusive vs. Exclusive)
 *
 * 1. [0..10]  -> Two dots = Inclusive. You get 11 items.
 *                (Used rarely, mostly for specific ranges like years).
 *
 * 2. [0...10] -> Three dots = Exclusive. You get exactly 10 items.
 *                (The Standard for Pagination and AI Agents).
 */

import { defineQuery } from "next-sanity"
import { LOW_STOCK_THRESHOLD } from "@/lib/constants/stock"

// ============================================
// SHARED FRAGMENTS (The "Lego Blocks")
// ============================================

const PRODUCT_FILTER_CONDITIONS = `
  _type == "product"
  && ($categorySlug == "" || category->slug.current == $categorySlug)
  && ($color == "" || color == $color)
  && ($material == "" || material == $material)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
  && ($searchQuery == "" || name match $searchQuery + "*" || description match $searchQuery + "*")
  && ($inStock == false || stock > 0)
`

const FILTERED_PRODUCT_PROJECTION = `{
  _id,
  name,
  "slug": slug.current,
  price,
  "images": images[0...4]{
    _key,
    asset->{ _id, url }
  },
  category->{ _id, title, "slug": slug.current },
  material,
  color,
  stock
}`

const RELEVANCE_SCORE = `score(
  boost(name match $searchQuery + "*", 3),
  boost(description match $searchQuery + "*", 1)
)`

// ============================================
// PRODUCTION QUERIES
// ============================================

export const ALL_PRODUCTS_QUERY =
  defineQuery(`*[ _type == "product" ] | order(name asc) {
  _id, name, "slug": slug.current, description, price,
  "images": images[]{ _key, asset->{ _id, url }, hotspot },
  category->{ _id, title, "slug": slug.current },
  material, color, dimensions, stock, featured, assemblyRequired
}`)

export const FEATURED_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product" && featured == true && stock > 0
] | order(name asc) [0...6] {
  _id, name, "slug": slug.current, price,
  "images": images[]{ _key, asset->{ _id, url }, hotspot },
  category->{ _id, title, "slug": slug.current },
  stock
}`)

export const PRODUCT_BY_SLUG_QUERY = defineQuery(`*[
  _type == "product" && slug.current == $slug
][0] {
  _id, name, "slug": slug.current, description, price,
  "images": images[]{ _key, asset->{ _id, url }, hotspot },
  category->{ _id, title, "slug": slug.current },
  material, color, dimensions, stock, featured, assemblyRequired
}`)

export const FILTER_PRODUCTS_BY_NAME_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}] | order(name asc) ${FILTERED_PRODUCT_PROJECTION}`,
)

export const FILTER_PRODUCTS_BY_RELEVANCE_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}] | ${RELEVANCE_SCORE} | order(_score desc, name asc) ${FILTERED_PRODUCT_PROJECTION}`,
)

export const LOW_STOCK_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product" && stock > 0 && stock <= ${LOW_STOCK_THRESHOLD}
] | order(stock asc) {
  _id, name, "slug": slug.current, stock,
  "image": images[0]{ asset->{ _id, url } }
}`)

/**
 * Explanation of Core Queries
 
 export const PRODUCT_BY_SLUG_QUERY = defineQuery(`*[
  _type == "product" &&    // 1. FILTER: Documents of type 'product'
  slug.current == $slug    // 2. MATCH: Unique URL slug
][0] {                     // 3. SELECT: Just the first object
  _id,
  name,
  "slug": slug.current,
  description,
  price,
  "images": images[]{      // 4. ARRAY: Get all images for the gallery
    _key,                  // 5. KEY: Required for React list rendering
    asset->{ _id, url },   // 6. LINK: Get the file URL
    hotspot                // 7. CROP: Focal point data
  },
  category->{              // 8. JOIN: Expand the category reference
    _id,
    title,
    "slug": slug.current
  },
  stock
}`)

export const FILTER_PRODUCTS_BY_NAME_QUERY = defineQuery(`*[
  _type == "product" && 
  ($categorySlug == "" || category->slug.current == $categorySlug) // 9. LOGIC: If slug is empty, skip filter
  && ($minPrice == 0 || price >= $minPrice)                       // 10. RANGE: Standard price filtering
  && ($searchQuery == "" || name match $searchQuery + "*")        // 11. WILDCARD: Search for names starting with X
] | order(name asc) {                                             // 12. SORT: Alphabetical
  _id,
  "images": images[0...4]                                         // 13. LIMIT: Get first 4 images for hover effect
}`)

export const LOW_STOCK_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && stock > 0
  && stock <= ${LOW_STOCK_THRESHOLD} // 14. CONSTANT: Uses our global threshold (e.g., 5)
] | order(stock asc)`)
*/

/**
 * ============================================================================
 * WHY THIS IS "SAFE AND LONG-LASTING"
 * ============================================================================
 *
 * 1. FRAGMENT REUSE: PRODUCT_FILTER_CONDITIONS is used in 4 different queries.
 *    If you add a "Size" filter later, you only change it in ONE place.
 *
 * 2. RELEVANCE SCORING: Using score() and boost() makes your search feel
 *    "Google-like." It prioritizes names over descriptions.
 *
 * 3. HOVER PREVIEW OPTIMIZATION: By fetching images[0...4], we give the
 *    frontend enough data for a "Hover to see more" effect without
 *    downloading every single product image.
 *
 * 4. AI AGENT READY: The AI_SEARCH_PRODUCTS_QUERY includes description and
 *    dimensions, allowing your AI Agent to answer complex questions like
 *    "Will this fit in a 100cm space?"
 */
