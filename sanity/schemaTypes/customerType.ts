// 1. IMPORTS: Bringing in tools
import { UserIcon } from "lucide-react" // The icon shown in the CMS sidebar
import { defineField, defineType } from "sanity" // Helpers for TypeScript autocomplete

export const customerType = defineType({
  // --- BASIC IDENTITY ---
  name: "customer", // Technical ID used in your code/queries (e.g., in GROQ)
  title: "Customer", // Human-friendly name shown in the Sanity Dashboard
  type: "document", // Means this is a main "page" or "entry" in your database
  icon: UserIcon, // Visual icon for the sidebar

  // --- UI ORGANIZATION (TABS) ---
  // Groups allow you to split long forms into tabs so they aren't overwhelming.
  groups: [
    {
      name: "details",
      title: "Customer Details",
      default: true, // This tab is open by default when clicking a customer
    },
    {
      name: "stripe",
      title: "Stripe Payment Info",
    },
  ],

  // --- THE DATA FIELDS ---
  fields: [
    // FIELD: Email
    defineField({
      name: "email",
      type: "string",
      group: "details", // Places this field in the 'Details' tab
      // VALIDATION: Ensures data is clean before saving
      validation: (rule) => [
        rule.required().error("Email is required"),
        rule.email().error("Must be a valid email address"),
      ],
    }),

    // FIELD: Full Name
    defineField({
      name: "name",
      type: "string",
      group: "details",
      description: "The customer's legal name used for shipping/billing",
    }),

    // FIELD: Clerk ID (The Auth Bridge)
    defineField({
      name: "clerkUserId",
      type: "string",
      group: "details",
      // This connects this Sanity document to the logged-in user in Clerk
      description: "The unique ID from Clerk (Authentication)",
    }),

    // FIELD: Stripe ID (The Payment Bridge)
    defineField({
      name: "stripeCustomerId",
      type: "string",
      group: "stripe", // Places this in the 'Stripe' tab
      readOnly: true, // SAFE: Prevents humans from accidentally editing this ID
      description: "Automatically synced from Stripe. Do not edit manually.",
    }),

    // FIELD: Creation Date (The Metadata)
    defineField({
      name: "createdAt",
      type: "datetime",
      group: "details",
      readOnly: true, // SAFE: The 'Join Date' should never change
      // INITIAL VALUE: Automatically sets the time to "Now" when created
      initialValue: () => new Date().toISOString(),
    }),
  ],

  // --- CMS DASHBOARD APPEARANCE (PREVIEW) ---
  // This controls how a customer looks in a list of 1,000 other customers
  preview: {
    // 1. Select the data we want to use for the preview
    select: {
      email: "email",
      name: "name",
      stripeId: "stripeCustomerId",
    },
    // 2. Format that data for the human eye
    prepare({ email, name, stripeId }) {
      return {
        // Title: Use name if it exists, otherwise use email
        title: name ?? email ?? "Unknown Customer",
        // Subtitle: Show email + Stripe ID as a small secondary text
        subtitle: stripeId ? `${email} [Stripe: ${stripeId}]` : email,
      }
    },
  },

  // --- SORTING OPTIONS (ORDERINGS) ---
  // Adds a dropdown menu in the CMS to sort the list of customers
  orderings: [
    {
      title: "Newest Joined",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Alphabetical (Email)",
      name: "emailAsc",
      by: [{ field: "email", direction: "asc" }],
    },
  ],
})
