import { createClient } from "next-sanity"

import { apiVersion, dataset, projectId } from "../env"

export const client = createClient({
  projectId, // Your Sanity project ID (from environment variables).
  dataset, // Your Sanity dataset name (e.g., "production").
  apiVersion, // API version for Sanity queries (e.g., "2023-01-01" – this ensures compatibility).
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
  perspective: "published",
})

// Write client (for mutations - used in webhooks/server actions)
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Disables CDN for writes (mutations need real-time consistency).
  token: process.env.SANITY_API_WRITE_TOKEN, // API token for write access.
})
