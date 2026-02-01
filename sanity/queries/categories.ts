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
 * ALL_CATEGORIES_QUERY
 * Use Case: Building navigation menus, filter sidebars, or category grid pages.
 */
export const ALL_CATEGORIES_QUERY = defineQuery(`*[ 
  _type == "category" 
] | order(title asc) { 
  _id,                 
  title,               
  "slug": slug.current,
  "image": image {     
    asset-> {         
      _id,             
      url             
    },                 
    hotspot          
  }
}`)

/**
 * 
 * Explaination of Query
 
export const ALL_CATEGORIES_QUERY =
  defineQuery(`*[ // 1. Global Selector: Look through every document
  _type == "category" // 2. Filter: Only include documents where type is 'category'
] | order(title asc) { // 3. Pipe & Sort: Arrange the results alphabetically (A to Z)
  _id,                 // 4. ID: The unique database key for the document
  title,               // 5. Field: The human-readable name (e.g., "Tables")
  "slug": slug.current,// 6. Flatten: Extract current string from the slug object
  "image": image {     // 7. Object: Open the image data container
    asset-> {          // 8. Dereference: Follow the ID link to the actual file
      _id,             // 9. Asset ID: The unique ID for the image file
      url              // 10. URL: The direct web link to the image file
    },                 // 11. Close asset block
    hotspot            // 12. Field: Include the focal-point/crop data
  }                    // 13. Close image block
}`)
*/

/**
 * PRODUCT_SEARCH_QUERY
 * Use Case: The main search page. It filters by text, category, and price.
 */
export const CATEGORY_BY_SLUG_QUERY = defineQuery(`*[
  _type == "category"
  && slug.current == $slug
][0] {
  _id,
  title,
  "slug": slug.current,
  "image": image{
    asset->{
      _id,
      url
    },
    hotspot
  }
}`)

/**Query Explaination
 * 
 export const PRODUCT_SEARCH_QUERY = defineQuery(`*[
  _type == "product" &&           // 1. FILTER: Only look for documents of type 'product'
  (
    name match $search ||         // 2. SEARCH: Does the name contain the search string?
    description match $search     // 3. OR: Does the description contain the search string?
  ) &&
  ($category == null ||           // 4. OPTIONAL: If no category is picked, show all
   category->slug.current == $category) && // 5. OR: Match the specific category slug
  (price >= $minPrice &&          // 6. RANGE: Price must be greater than or equal to min
   price <= $maxPrice)            // 7. RANGE: Price must be less than or equal to max
] | order(price asc) {            // 8. SORT: Show cheapest products first
  _id,                            // 9. ID: Unique database key
  name,                           // 10. NAME: Product name
  "slug": slug.current,           // 11. FLATTEN: Transform slug object to string
  "image": images[0] {            // 12. FIRST IMAGE: Get only the first image from array
    asset->{                      // 13. DEREFERENCE: Follow link to image file
      url                         // 14. URL: Get the web link
    },
    hotspot                       // 15. HOTSPOT: Get cropping data
  },
  price,                          // 16. PRICE: Current price
  stock,                          // 17. STOCK: Current inventory count
  "categoryTitle": category->title // 18. JOIN: Reach into category to get its title
}`)
 */

/**
 * ============================================================================
 * WHY THIS IS "SAFE AND LONG-LASTING"
 * ============================================================================
 *
 * 1. PARAMETERIZATION: By using $slug, we prevent 'SQL Injection' style attacks.
 *    The variable is handled safely by the Sanity driver.
 *
 * 2. BANDWIDTH EFFICIENCY: We only fetch 'url' and 'hotspot'. We ignore
 *    hundreds of lines of hidden Sanity metadata that we don't need.
 *
 * 3. TYPE SAFETY: Using 'defineQuery' allows TypeScript to automatically
 *    know that 'category.title' is a string, preventing "cannot read property
 *    of undefined" crashes during build time.
 *
 * 4. AI AGENT READY: If you give these queries to an AI Agent (like via MCP),
 *    the flattened "slug" field makes it 100% easier for the AI to
 *    understand and generate links for the user.
 */
