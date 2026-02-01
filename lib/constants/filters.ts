/**
 * ============================================================================
 * PRODUCT ATTRIBUTE CONSTANTS (The "Dictionary")
 * These constants are the "Single Source of Truth" for your whole app.
 * ============================================================================
 */

/**
 * COLORS: Used for filtering products and the Sanity Color dropdown.
 * We use 'as const' to tell TypeScript: "These strings will NEVER change."
 * This allows us to use them as literal types rather than just general 'strings'.
 */
export const COLORS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "oak", label: "Oak" },
  { value: "walnut", label: "Walnut" },
  { value: "grey", label: "Grey" },
  { value: "natural", label: "Natural" },
] as const

/**
 * MATERIALS: Used for filtering products and the Sanity Material dropdown.
 */
export const MATERIALS = [
  { value: "wood", label: "Wood" },
  { value: "metal", label: "Metal" },
  { value: "fabric", label: "Fabric" },
  { value: "leather", label: "Leather" },
  { value: "glass", label: "Glass" },
] as const

/**
 * SORT_OPTIONS: Used for the "Sort By" dropdown on the frontend.
 * Note: 'relevance' is usually the default for Search/AI results.
 */
export const SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "relevance", label: "Relevance" },
] as const

/**
 * ============================================================================
 * TYPE EXTRACTION (The "Ghost" Types)
 * We extract types directly from the arrays above so we don't have to
 * write the list of colors twice. If you add a color to the array,
 * the type updates automatically.
 * ============================================================================
 */

// This creates a union type: "black" | "white" | "oak" | etc.
export type ColorValue = (typeof COLORS)[number]["value"]

// This creates a union type: "wood" | "metal" | etc.
export type MaterialValue = (typeof MATERIALS)[number]["value"]

// This creates a union type: "name" | "price_asc" | etc.
export type SortValue = (typeof SORT_OPTIONS)[number]["value"]

/**
 * ============================================================================
 * SANITY SCHEMA FORMATTING
 * Sanity CMS expects a specific format: { title: string, value: string }.
 * We map our constants to fit this format perfectly.
 * ============================================================================
 */

/**
 * COLORS_SANITY_LIST: Used in product.ts schema options.list
 * We rename 'label' to 'title' because that is what Sanity requires.
 */
export const COLORS_SANITY_LIST = COLORS.map(({ value, label }) => ({
  title: label,
  value,
}))

/**
 * MATERIALS_SANITY_LIST: Used in product.ts schema options.list
 */
export const MATERIALS_SANITY_LIST = MATERIALS.map(({ value, label }) => ({
  title: label,
  value,
}))

/**
 * ============================================================================
 * ZOD & VALIDATION HELPERS (The "Safety Bridge")
 * Zod's z.enum() function requires a NON-EMPTY array.
 * When we use .map(), TypeScript "forgets" that the array has items.
 * We use a "Variadic Tuple" to prove to Zod that the array is not empty.
 * ============================================================================
 */

/**
 * COLOR_VALUES: An array of just the values ["black", "white", ...]
 * The 'as [ColorValue, ...ColorValue[]]' part is a "Pinky Promise" to Zod:
 * "I guarantee there is at least one color at index 0, and then more after it."
 */
export const COLOR_VALUES = COLORS.map((c) => c.value) as [
  ColorValue,
  ...ColorValue[],
]

/**
 * MATERIAL_VALUES: Same logic as above, but for materials.
 */
export const MATERIAL_VALUES = MATERIALS.map((m) => m.value) as [
  MaterialValue,
  ...MaterialValue[],
]

/**
 * ============================================================================
 * HELPER FOR DIMENSIONS (W x D x H)
 * E-commerce Standard: Width x Depth x Height
 * ============================================================================
 */
export const DIMENSION_HELP_TEXT =
  "Standard format: Width x Depth x Height (e.g., 120cm x 80cm x 75cm)"
