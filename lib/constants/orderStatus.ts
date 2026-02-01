/**
 * ============================================================================
 * 1. IMPORTS & TYPES (The Architecture)
 * ============================================================================
 */
import {
  Package, // Icon for 'delivered'
  Truck, // Icon for 'shipped'
  XCircle, // Icon for 'cancelled'
  CreditCard, // Icon for 'paid'
  type LucideIcon, // The TypeScript type for a React component icon
} from "lucide-react"

/**
 * ORDER_STATUS_VALUE: The "Legal Strings"
 * These are the ONLY 4 words the database is allowed to use for order status.
 */
export type OrderStatusValue = "paid" | "shipped" | "delivered" | "cancelled"

/**
 * ORDER_STATUS_CONFIG (Interface): The "Blueprint"
 * Every single status (paid, shipped, etc.) MUST provide all these 7 pieces of info.
 * This prevents bugs where one status has an icon but another doesn't.
 */
export interface OrderStatusConfig {
  value: OrderStatusValue // The technical key (e.g., "paid")
  label: string // The human name (e.g., "Paid")
  color: string // Tailwind classes for the status Badge (text + background)
  icon: LucideIcon // The actual React Icon component
  emoji: string // A simple emoji for AI Chat bots to use
  iconColor: string // The CSS color of the icon itself (for widgets)
  iconBgColor: string // The background circle color for the icon (for widgets)
}

/**
 * ============================================================================
 * 2. THE MASTER CONFIG (The Source of Truth)
 * ============================================================================
 * This is a 'Record'. It maps the 'OrderStatusValue' to the 'OrderStatusConfig'.
 */
export const ORDER_STATUS_CONFIG: Record<OrderStatusValue, OrderStatusConfig> =
  {
    paid: {
      value: "paid",
      label: "Paid",
      color: "bg-green-100 text-green-800", // Light green badge
      icon: CreditCard,
      emoji: "✅",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    shipped: {
      value: "shipped",
      label: "Shipped",
      color: "bg-blue-100 text-blue-800", // Blue badge
      icon: Truck,
      emoji: "📦",
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    delivered: {
      value: "delivered",
      label: "Delivered",
      color: "bg-zinc-100 text-zinc-800", // Grey badge
      icon: Package,
      emoji: "🎉",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    cancelled: {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800", // Red badge
      icon: XCircle,
      emoji: "❌",
      iconColor: "text-red-600 dark:text-red-400",
      iconBgColor: "bg-red-100 dark:bg-red-900/30",
    },
  }

/**
 * ============================================================================
 * 3. DERIVED LISTS (The Bridges)
 * These lines take the Master Config and turn them into formats for other tools.
 * ============================================================================
 */

/**
 * ORDER_STATUS_VALUES: A simple array ["paid", "shipped", "delivered", "cancelled"]
 * We use Object.keys so we don't have to type the list manually.
 */
export const ORDER_STATUS_VALUES = Object.keys(
  ORDER_STATUS_CONFIG,
) as OrderStatusValue[]

/**
 * ORDER_STATUS_TABS: Used for the Admin Dashboard Filter Bar.
 * It adds "All" to the beginning so the admin can see every order.
 */
export const ORDER_STATUS_TABS = [
  { value: "all", label: "All" },
  ...ORDER_STATUS_VALUES.map((value) => ({
    value,
    label: ORDER_STATUS_CONFIG[value].label,
  })),
] as const

/**
 * ORDER_STATUS_SANITY_LIST: Used in your 'order.ts' Sanity Schema.
 * It formats the data into {title, value} which Sanity requires for dropdowns.
 */
export const ORDER_STATUS_SANITY_LIST = ORDER_STATUS_VALUES.map((value) => ({
  title: ORDER_STATUS_CONFIG[value].label,
  value,
}))

/**
 * ============================================================================
 * 4. HELPER FUNCTIONS (The Execution)
 * ============================================================================
 */

/**
 * getOrderStatus: The "Safety Net"
 * If the database sends a weird status, this function prevents the app from crashing.
 * It returns the full config object. If the status is unknown, it defaults to "paid".
 */
export const getOrderStatus = (
  status: string | null | undefined,
): OrderStatusConfig =>
  ORDER_STATUS_CONFIG[status as OrderStatusValue] ?? ORDER_STATUS_CONFIG.paid

/**
 * getOrderStatusEmoji: The "AI Mouthpiece"
 * This converts a boring database string into a pretty string for the AI Chat agent.
 * Example: "shipped" -> "📦 Shipped"
 */
export const getOrderStatusEmoji = (
  status: string | null | undefined,
): string => {
  const config = getOrderStatus(status)
  return `${config.emoji} ${config.label}`
}
