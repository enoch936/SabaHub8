import { NextRequest } from "next/server";

// WebSocket proxy for Codespaces
// This proxies WebSocket connections to the backend at localhost:8080/ws
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  
  // Upgrade to WebSocket is not directly supported in Next.js API routes
  // Return a message that WebSocket should connect directly
  return new Response(
    JSON.stringify({ 
      error: "WebSocket proxy not supported in Next.js API routes",
      message: "For Codespaces, WebSocket port 8080 needs to be publicly accessible",
      suggestion: "Update port visibility to public in Codespaces ports panel"
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
