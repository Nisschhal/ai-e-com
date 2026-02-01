/**
 * ============================================================================
 * 1. THE THRESHOLD (The Business Rule)
 * ============================================================================
 */

/**
 * LOW_STOCK_THRESHOLD: The "Alert" level.
 * Why use a constant? If your boss decides "Low Stock" should be 10 instead of 5,
 * you change it here ONCE and the entire app (and AI Agent) updates instantly.
 */
export const LOW_STOCK_THRESHOLD = 5

/**
 * ============================================================================
 * 2. BOOLEAN HELPERS (Simple Yes/No Checks)
 * ============================================================================
 */

/**
 * isLowStock: Checks if we need to show a "Hurry! Only X left" warning.
 * Logic: It must be more than 0 (not sold out) but less than or equal to 5.
 */
export const isLowStock = (stock: number): boolean =>
  stock > 0 && stock <= LOW_STOCK_THRESHOLD

/**
 * isOutOfStock: Checks if we need to disable the "Add to Cart" button.
 * Logic: True if stock is 0 or (safely) a negative number due to data errors.
 */
export const isOutOfStock = (stock: number): boolean => stock <= 0

/**
 * ============================================================================
 * 3. THE LOGIC ENGINE (Categorization)
 * ============================================================================
 */

/**
 * getStockStatus: Categorizes the raw number into a readable 'State'.
 * Why 'unknown'? Because sometimes data from Sanity might be missing.
 * This function uses "Waterfall Logic": It checks the most urgent state first.
 */
export const getStockStatus = (
  stock: number | null | undefined,
): "out_of_stock" | "low_stock" | "in_stock" | "unknown" => {
  // 1. Check for missing data first (Safety)
  if (stock === null || stock === undefined) return "unknown"

  // 2. Check if sold out (Urgent)
  if (stock <= 0) return "out_of_stock"

  // 3. Check if running low (Warning)
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock"

  // 4. Everything else is fine
  return "in_stock"
}

/**
 * ============================================================================
 * 4. THE UI & AI LAYER (Human/Bot Communication)
 * ============================================================================
 */

/**
 * getStockMessage: The "Mouthpiece" of the inventory system.
 * Use case 1 (Frontend): Displaying a badge on the product page.
 * Use case 2 (AI Agent): Telling a customer if they can buy the item.
 */
export const getStockMessage = (stock: number | null | undefined): string => {
  const status = getStockStatus(stock)

  switch (status) {
    case "out_of_stock":
      return "OUT OF STOCK - Currently unavailable"

    case "low_stock":
      // Uses "Template Literals" to inject the actual number into the warning
      return `LOW STOCK - Only ${stock} left`

    case "in_stock":
      return `In stock (${stock} available)`

    default:
      return "Stock status unknown"
  }
}
