import { createAgentUIStreamResponse, type UIMessage } from "ai"
import { auth } from "@clerk/nextjs/server"
import { createShoppingAgent } from "@/lib/ai/shopping-agent"

export async function POST(request: Request) {
  try {
    // 1. Safe JSON parsing
    let body
    try {
      body = await request.json()
    } catch {
      return errorResponse("Invalid JSON", 400)
    }

    // 2. Validate messages
    const { messages }: { messages: UIMessage[] } = body || {}
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse("Missing or invalid messages", 400)
    }

    console.log("Messages arrived:", JSON.stringify(messages))

    // 3. Safe auth
    let userId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult.userId
    } catch (authError) {
      console.warn("Auth failed:", authError)
    }

    // 4. Create agent safely
    let agent
    try {
      agent = createShoppingAgent({ userId })
    } catch (agentError) {
      console.error("Agent creation failed:", agentError)
      return errorResponse("Service temporarily unavailable", 503)
    }

    // 5. Stream response
    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
    })
  } catch (error) {
    console.error("[Chat API] Fatal error:", error)
    return errorResponse("Something went wrong. Please try again.", 500)
  }
}

// Helper for consistent error responses
function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
