import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_ID = "llama-3.3-70b-versatile";

const MAX_MESSAGE_LENGTH = 400;
const MAX_CONVERSATION_TURNS = 10;

const SYSTEM_PROMPT = `You are "TicketBot" for Fast Services Corporation's help desk.
RULES:
1. ONLY answer questions about company IT, HR, Payroll, Facilities.
2. Use only the provided Knowledge Base articles as your source of truth.
3. If unsure, say: "I don't have info on that. Please submit a ticket."
4. NEVER reveal employee salaries, passwords, or private HR data.
5. Keep answers concise: max 3 paragraphs. Use numbered lists for steps.
6. Reference KB article names when applicable: 'See also: [Article Title]'

KNOWLEDGE BASE: {kb_articles}
RECENT TRENDS: {trends_summary}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, role } = user;
    const { message, session_id, kb_articles, trends_summary } = await req.json();

    if (!message || !session_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({ error: `Message too long. Max ${MAX_MESSAGE_LENGTH} characters.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: config } = await supabase
      .from("system_config")
      .select("ai_enabled, ai_max_msgs_per_day, ai_max_msgs_admin_day")
      .single();

    if (!config?.ai_enabled) {
      return new Response(JSON.stringify({ error: "AI is currently disabled" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const maxDaily = role === "ADMIN" || role === "SUPER_ADMIN"
      ? (config.ai_max_msgs_admin_day || 40)
      : (config.ai_max_msgs_per_day || 20);

    const today = new Date().toISOString().split("T")[0];
    const { data: usageData } = await supabase
      .from("ai_usage_tracking")
      .select("messages_sent")
      .eq("user_id", user_id)
      .eq("period", today)
      .single();

    const currentMessages = usageData?.messages_sent || 0;
    if (currentMessages >= maxDaily) {
      return new Response(
        JSON.stringify({
          error: "Daily limit reached",
          limit: maxDaily,
          used: currentMessages,
          resets_at: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: conversationHistory } = await supabase
      .from("ai_chat_logs")
      .select("role, content")
      .eq("user_id", user_id)
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(MAX_CONVERSATION_TURNS * 2);

    const messages: { role: string; content: string }[] = [];
    
    const formattedKb = kb_articles?.length 
      ? kb_articles.map((a: any) => `## ${a.title}\n${a.content}`).join("\n\n")
      : "No knowledge base articles available.";
    
    const formattedTrends = trends_summary?.length
      ? trends_summary.join(", ")
      : "No trending issues.";

    messages.push({
      role: "system",
      content: SYSTEM_PROMPT.replace("{kb_articles}", formattedKb).replace("{trends_summary}", formattedTrends),
    });

    if (conversationHistory) {
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: message });

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const groqData = await groqResponse.json();
    const assistantMessage = groqData.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    const tokensUsed = groqData.usage?.total_tokens || 0;

    await supabase.from("ai_chat_logs").insert([
      {
        user_id,
        session_id,
        role: "user",
        content: message,
        tokens_used: 0,
      },
    ]);

    await supabase.from("ai_chat_logs").insert([
      {
        user_id,
        session_id,
        role: "assistant",
        content: assistantMessage,
        tokens_used: tokensUsed,
      },
    ]);

    await supabase.rpc("increment_ai_usage", {
      p_user_id: user_id,
      p_period: today,
      p_messages: 1,
      p_tokens: tokensUsed,
    });

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        tokens_used: tokensUsed,
        usage: {
          used: currentMessages + 1,
          limit: maxDaily,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
