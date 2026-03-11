interface AnalyticsEventPayload {
  sessionId: string;
  visitorId: string;
  uid?: string | null;
  pageUrl?: string;
  pagePath?: string;
  userAgent?: string;
  referrer?: string;
  eventType: "page_view" | "session_start" | "session_end";
  startedAt?: string;
  endedAt?: string;
  viewedDurationMs?: number;
  isBounced?: boolean;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  console.log("[capture-analytics] Received request:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: AnalyticsEventPayload = await req.json();
    console.log("[capture-analytics] Payload received:", payload.eventType);

    if (!payload.sessionId || !payload.visitorId || !payload.eventType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Supabase configuration - use fallback URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://qaefqokcjhptnrotsiqr.supabase.co";
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    console.log("[capture-analytics] SUPABASE_URL:", supabaseUrl);
    console.log("[capture-analytics] SERVICE_ROLE_KEY exists:", !!serviceRoleKey);

    if (!serviceRoleKey) {
      console.error("[capture-analytics] Missing SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Missing SERVICE_ROLE_KEY environment variable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract IP address
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    console.log("[capture-analytics] IP Address:", ipAddress);

    // Import Supabase client dynamically
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log("[capture-analytics] Supabase client created");

    // Process by event type
    if (payload.eventType === "session_start") {
      console.log("[capture-analytics] Processing session_start");
      const insertData = {
        session_id: payload.sessionId,
        visitor_id: payload.visitorId,
        uid: payload.uid || null,
        ip_address: ipAddress,
        user_agent_text: payload.userAgent || null,
        started_at: payload.startedAt || new Date().toISOString(),
      };
      console.log("[capture-analytics] Insert data:", insertData);
      
      const { data, error, status } = await supabase.from("analytics_data").insert(insertData).select();

      console.log("[capture-analytics] Insert response:", { status, data, error });

      if (error) {
        console.error("[capture-analytics] ❌ Insert error:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return new Response(
          JSON.stringify({ error: "Failed to insert session", details: error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[capture-analytics] ✅ Session inserted successfully", { data, count: data?.length });
      return new Response(
        JSON.stringify({ success: true, message: "Session started", data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.eventType === "page_view") {
      console.log("[capture-analytics] Processing page_view");
      const insertData = {
        session_id: payload.sessionId,
        visitor_id: payload.visitorId,
        uid: payload.uid || null,
        page_url: payload.pageUrl || null,
        page_path: payload.pagePath || null,
        referrer: payload.referrer || null,
        viewed_at: new Date().toISOString(),
        viewed_duration_ms: payload.viewedDurationMs || 0,
      };
      console.log("[capture-analytics] Insert data:", insertData);
      
      const { data, error, status } = await supabase.from("page_views").insert(insertData).select();

      console.log("[capture-analytics] Insert response:", { status, data, error });

      if (error) {
        console.error("[capture-analytics] ❌ Page view insert error:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return new Response(
          JSON.stringify({ error: "Failed to insert page view", details: error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[capture-analytics] ✅ Page view inserted successfully", { data, count: data?.length });
      return new Response(
        JSON.stringify({ success: true, message: "Page view recorded", data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.eventType === "session_end") {
      console.log("[capture-analytics] Processing session_end");
      const updateData = {
        ended_at: payload.endedAt || new Date().toISOString(),
        duration_ms: payload.viewedDurationMs || 0,
        is_bounced: payload.isBounced || false,
      };
      console.log("[capture-analytics] Update data:", { session_id: payload.sessionId, ...updateData });
      
      const { data, error, status } = await supabase
        .from("analytics_data")
        .update(updateData)
        .eq("session_id", payload.sessionId)
        .is("ended_at", null)
        .select();

      console.log("[capture-analytics] Update response:", { status, data, error });

      if (error) {
        console.error("[capture-analytics] ❌ Update error:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return new Response(
          JSON.stringify({ error: "Failed to update session", details: error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[capture-analytics] ✅ Session updated successfully", { data, count: data?.length });
      return new Response(
        JSON.stringify({ success: true, message: "Session ended", data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown event type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[capture-analytics] Catch error:", error.message, error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
