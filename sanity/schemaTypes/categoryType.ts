// 1. IMPORTS
import { TagIcon } from "@sanity/icons" // A built-in Sanity icon (looks like a price tag)
import { defineField, defineType } from "sanity" // Helpers for TypeScript type safety

export const categoryType = defineType({
  // --- IDENTITY ---
  name: "category", // The ID used in GROQ queries (e.g., *[_type == "category"])
  title: "Category", // The label displayed in the Sanity Studio sidebar
  type: "document", // Defines this as a top-level piece of content
  icon: TagIcon, // The icon shown next to "Category" in the CMS

  // --- FIELDS ---
  fields: [
    // FIELD: Title
    defineField({
      name: "title",
      type: "string",
      title: "Category Title",
      validation: (rule) => [
        rule.required().error("Category title is required"),
      ],
    }),

    // FIELD: Slug (The URL ID)
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title", // Automatically generates the slug from the 'title' field
        maxLength: 96, // Limits length to keep URLs clean
      },
      validation: (rule) => [
        rule.required().error("Slug is required for URL generation"),
      ],
    }),

    // FIELD: Image
    defineField({
      name: "image",
      type: "image",
      options: {
        hotspot: true, // Allows editors to select the "focal point" of an image
      },
      description: "Visual thumbnail representing this category",
    }),
  ],

  // --- CMS UI PREVIEW ---
  // Controls how the category looks in the list view (the sidebar list)
  preview: {
    select: {
      title: "title", // Display the 'title' field as the main text
      media: "image", // Display the 'image' field as the thumbnail icon
    },
  },
})
