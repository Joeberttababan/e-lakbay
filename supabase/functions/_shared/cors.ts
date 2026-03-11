// CORS configuration for edge functions
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function handleCorsRequest(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
}

export function createCorsResponse(body: string, status = 200, headers: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...headers,
    },
  });
}

export function createErrorResponse(error: string, status = 400) {
  return createCorsResponse(JSON.stringify({ error }), status);
}

export function createSuccessResponse(data: unknown, message?: string) {
  return createCorsResponse(
    JSON.stringify({
      success: true,
      data,
      ...(message && { message }),
    }),
    200
  );
}
