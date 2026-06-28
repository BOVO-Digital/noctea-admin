import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { loadAiConfig } from "@/lib/ai-config-store";
import { buildContentSystemPrompt } from "@/lib/ai-config";

const SECTION_LABELS: Record<string, string> = {
  title: "titre accrocheur (max 80 caractères, texte brut sans HTML)",
  summary: "résumé en 1-2 phrases",
  body: "corps de l'article en HTML (<h2>, <p>, <ul>, <li>, <strong>, min 300 mots)",
  sources: "liste de sources ou références (texte libre, peut être vide)",
  tags: "tableau JSON de 3 à 5 tags en français",
};

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json() as {
    section?: string;
    topic?: string;
    contentType?: string;
    targetPlan?: string;
    style?: string;
    currentTitle?: string;
    currentSummary?: string;
    currentBody?: string;
    currentSources?: string;
    includeSources?: boolean;
  };

  const section = body.section ?? "body";
  if (!SECTION_LABELS[section]) {
    return NextResponse.json({ error: "Section invalide" }, { status: 400 });
  }
  if (!body.topic?.trim()) {
    return NextResponse.json({ error: "topic requis" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-PLACEHOLDER")) {
    return NextResponse.json(
      { error: "La clé OpenAI n'est pas configurée" },
      { status: 503 }
    );
  }

  const aiConfig = await loadAiConfig();
  if (!aiConfig.aiContentEnabled) {
    return NextResponse.json({ error: "Génération IA désactivée" }, { status: 403 });
  }

  const jsonSchema =
    section === "tags"
      ? `{ "tags": ["tag1", "tag2", "tag3"] }`
      : section === "title"
        ? `{ "title": "..." }`
        : section === "summary"
          ? `{ "summary": "..." }`
          : section === "sources"
            ? `{ "sources": "..." }`
            : `{ "body": "..." }`;

  const systemPrompt = buildContentSystemPrompt(
    aiConfig.contentSystemPromptExtra,
    `Réponds UNIQUEMENT avec un objet JSON valide : ${jsonSchema}`
  );

  const userPrompt = `Régénère uniquement la section "${section}" (${SECTION_LABELS[section]}) pour un contenu ${body.contentType ?? "article"}.

Sujet : "${body.topic}"
Plan ciblé : ${body.targetPlan ?? "free"}
Style : ${body.style ?? "bienveillant"}

Contexte actuel :
- Titre : ${body.currentTitle ?? ""}
- Résumé : ${body.currentSummary ?? ""}
- Extrait body : ${(body.currentBody ?? "").slice(0, 500)}
- Sources actuelles : ${body.currentSources ?? ""}

${body.includeSources || section === "sources" ? "Inclus des références crédibles si pertinent." : ""}

Ne renvoie que la section demandée dans le JSON.`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.contentModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: section === "body" ? 2500 : 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return NextResponse.json(
        { error: `Erreur OpenAI (${openaiRes.status}): ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const openaiData = (await openaiRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = openaiData.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return NextResponse.json({
      section,
      value:
        section === "tags"
          ? parsed.tags
          : parsed[section] ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la régénération" }, { status: 500 });
  }
}
