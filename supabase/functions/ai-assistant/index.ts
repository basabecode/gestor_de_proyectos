import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, boardContext } = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      throw new Error(
        "ANTHROPIC_API_KEY secret not configured in Supabase Edge Functions",
      );
    }

    const systemPrompt = buildSystemPrompt(boardContext);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      throw new Error(`Anthropic API error ${anthropicRes.status}: ${err}`);
    }

    // Stream Anthropic's SSE response directly back to the client
    return new Response(anthropicRes.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// deno-lint-ignore no-explicit-any
function buildSystemPrompt(boardContext: any): string {
  const { name, description, groups = [], items = [] } =
    boardContext || {};

  const stats = {
    total: items.length,
    done: items.filter(
      // deno-lint-ignore no-explicit-any
      (i: any) => i.columnValues?.status === "done",
    ).length,
    inProgress: items.filter(
      // deno-lint-ignore no-explicit-any
      (i: any) =>
        i.columnValues?.status === "in_progress" ||
        i.columnValues?.status === "working_on_it",
    ).length,
    blocked: items.filter(
      // deno-lint-ignore no-explicit-any
      (i: any) => i.columnValues?.status === "stuck",
    ).length,
  };

  const progress =
    stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const groupSummaries = groups
    // deno-lint-ignore no-explicit-any
    .map((g: any) => {
      // deno-lint-ignore no-explicit-any
      const groupItems = items.filter((i: any) => i.groupId === g.id);
      const groupDone = groupItems.filter(
        // deno-lint-ignore no-explicit-any
        (i: any) => i.columnValues?.status === "done",
      ).length;
      return `  - "${g.title}": ${groupItems.length} elementos, ${groupDone} completados`;
    })
    .join("\n");

  return `Eres un asistente experto en gestión de proyectos integrado en Work OS (plataforma de gestión tipo Monday.com).

CONTEXTO DEL TABLERO ACTUAL:
- Nombre: ${name || "Sin nombre"}
- Descripción: ${description || "Sin descripción"}
- Total de elementos: ${stats.total}
- Completados: ${stats.done} (${progress}%)
- En progreso: ${stats.inProgress}
- Bloqueados/Stuck: ${stats.blocked}

GRUPOS:
${groupSummaries || "  Sin grupos"}

REGLAS:
- Responde SIEMPRE en español
- Sé conciso y estructurado; usa listas con viñetas (- ) para enumeraciones
- Basa tus análisis en los datos reales del tablero mostrados arriba
- Para sugerencias de tareas, usa formato: "Tarea: [nombre] | Grupo: [grupo] | Prioridad: [alta/media/baja]"
- Para riesgos, ordena de mayor a menor impacto y explica el impacto potencial
- No inventes datos que no estén en el contexto proporcionado`;
}
