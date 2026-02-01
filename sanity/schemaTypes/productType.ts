// 1. IMPORTS
import { PackageIcon } from "@sanity/icons" // Icon looking like a box/package
import { defineField, defineType } from "sanity"
// These constants are lists of strings (e.g., ["Wood", "Metal"]) imported from another file
import {
  MATERIALS_SANITY_LIST,
  COLORS_SANITY_LIST,
} from "@/lib/constants/filters"

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageIcon,

  // --- UI GROUPS (TABS) ---
  // Organizes the editor so you don't have to scroll through 12+ fields
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "media", title: "Media" },
    { name: "inventory", title: "Inventory" },
  ],

  fields: [
    // FIELD: Name & Slug (Standard Identity)
    defineField({
      name: "name",
      type: "string",
      group: "details",
      validation: (rule) => [rule.required().error("Product name is required")],
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "details",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => [rule.required().error("Slug is required")],
    }),

    // FIELD: Description (Plain text area)
    defineField({
      name: "description",
      type: "text", // 'text' provides a multi-line textarea (unlike 'string')
      group: "details",
      rows: 4, // Sets the initial height of the box
    }),

    // FIELD: Price (Critical for Stripe)
    defineField({
      name: "price",
      type: "number",
      group: "details",
      description: "Price in GBP (£)",
      validation: (rule) => [
        rule.required(),
        rule.positive().error("Price must be a positive number"),
      ],
    }),

    // FIELD: Category (The Bridge)
    // This creates a dropdown to select a document from the 'category' schema
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }], // Only allow linking to Category documents
      group: "details",
      validation: (rule) => [rule.required().error("Category is required")],
    }),

    // FIELDS: Material & Color (Pre-defined selections)
    defineField({
      name: "material",
      type: "string",
      group: "details",
      options: {
        list: MATERIALS_SANITY_LIST, // A list of choices (e.g., Oak, Velvet)
        layout: "radio", // Shows as radio buttons instead of a dropdown
      },
    }),
    defineField({
      name: "color",
      type: "string",
      group: "details",
      options: {
        list: COLORS_SANITY_LIST,
        layout: "radio",
      },
    }),

    // FIELD: Dimensions
    defineField({
      name: "dimensions",
      type: "string",
      group: "details",
      // The 'description' is for the person typing in the CMS
      description:
        'Standard: Width x Depth x Height (e.g., "120cm x 80cm x 75cm")',
      // The 'placeholder' is what appears inside the empty box
      placeholder: "W x D x H in cm",
    }),

    // FIELD: Image Gallery (The Array)
    defineField({
      name: "images",
      type: "array", // Allows multiple items
      group: "media",
      of: [{ type: "image", options: { hotspot: true } }], // An array of images
      validation: (rule) => [
        rule.min(1).error("At least one image is required"),
      ],
    }),

    // FIELDS: Inventory & Stock
    defineField({
      name: "stock",
      type: "number",
      group: "inventory",
      initialValue: 0,
      validation: (rule) => [
        rule.min(0).error("Stock cannot be negative"),
        rule.integer().error("Must be a whole number"),
      ],
    }),

    // FIELDS: Booleans (Switches)
    defineField({
      name: "featured",
      type: "boolean",
      group: "inventory",
      initialValue: false, // Default to 'off'
    }),
    defineField({
      name: "assemblyRequired",
      type: "boolean",
      group: "inventory",
      initialValue: false,
    }),
  ],

  // --- CMS PREVIEW LOGIC ---
  preview: {
    select: {
      title: "name",
      subtitle: "category.title", // Reach into the referenced category to get its title
      media: "images.0", // Use the first image in the array as the thumbnail
      price: "price",
    },
    prepare({ title, subtitle, media, price }) {
      return {
        title,
        // Shows "Category • £Price" in the list view
        subtitle: `${subtitle ? subtitle + " • " : ""}£${price ?? 0}`,
        media,
      }
    },
  },
})
