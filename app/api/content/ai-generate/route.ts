import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { loadAiConfig } from "@/lib/ai-config-store";
import { buildContentSystemPrompt } from "@/lib/ai-config";

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free: "gratuit (contenu essentiel, accessible à tous)",
  lune: "lune (contenu basique, premiers pas en parentalité)",
  etoile: "étoile (contenu avancé, conseils approfondis)",
  soleil: "soleil (contenu premium expert, recommandations personnalisées)",
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  articles: "article de fond informatif",
  stories: "courte histoire inspirante pour parents",
  conseils: "conseil pratique actionnable",
  wellbeing: "contenu bien-être et santé mentale parentale",
};

const STYLE_DESCRIPTIONS: Record<string, string> = {
  bienveillant: "bienveillant et empathique",
  éducatif: "éducatif et informatif",
  pratique: "pratique et orienté actions concrètes",
  inspirant: "inspirant et motivant",
};

const JSON_SCHEMA = `Format JSON requis :
{
  "title": "titre accrocheur en français (max 80 caractères)",
  "body": "contenu HTML complet avec balises <h2>, <p>, <ul>, <li>, <strong> (min 300 mots). Ne pas inclure le disclaimer médical ni la mention IA dans le body.",
  "summary": "résumé en 1-2 phrases maximum",
  "tags": ["tag1", "tag2", "tag3"],
  "sources": "sources ou références optionnelles (texte libre, peut être vide)"
}`;

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
) {
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    throw new Error(`Erreur OpenAI (${openaiRes.status}): ${errText.slice(0, 200)}`);
  }

  const openaiData = (await openaiRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return openaiData.choices?.[0]?.message?.content ?? "";
}

function parseContentJson(raw: string) {
  const parsed = JSON.parse(raw) as {
    title?: string;
    body?: string;
    summary?: string;
    tags?: string[];
    sources?: string;
  };
  return {
    title: parsed.title ?? "",
    body: parsed.body ?? "",
    summary: parsed.summary ?? "",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    sources: typeof parsed.sources === "string" ? parsed.sources : "",
  };
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json() as {
    topic?: string;
    contentType?: string;
    targetPlan?: string;
    language?: string;
    style?: string;
    includeSources?: boolean;
  };

  const {
    topic,
    contentType,
    targetPlan = "free",
    language = "fr",
    style = "bienveillant",
    includeSources = false,
  } = body;

  if (!topic?.trim() || !contentType) {
    return NextResponse.json({ error: "topic et contentType requis" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-PLACEHOLDER")) {
    return NextResponse.json(
      { error: "La clé OpenAI n'est pas configurée. Ajoutez OPENAI_API_KEY dans .env.local" },
      { status: 503 }
    );
  }

  const aiConfig = await loadAiConfig();
  if (!aiConfig.aiContentEnabled) {
    return NextResponse.json({ error: "La génération IA contenu est désactivée dans les paramètres" }, { status: 403 });
  }

  const systemPrompt = buildContentSystemPrompt(
    aiConfig.contentSystemPromptExtra,
    JSON_SCHEMA
  );

  const sourcesInstruction = includeSources
    ? "Inclus des sources ou références crédibles dans le champ sources (OMS, PMI, ou ouvrages reconnus)."
    : "Laisse le champ sources vide.";

  const userPrompt = `Génère un ${TYPE_DESCRIPTIONS[contentType] ?? contentType} sur le sujet suivant : "${topic}"

Plan ciblé : ${PLAN_DESCRIPTIONS[targetPlan] ?? targetPlan}
Style : ${STYLE_DESCRIPTIONS[style] ?? style}
Langue : ${language}
${sourcesInstruction}

Le contenu doit être adapté à des parents avec jeunes enfants (0-10 ans). Minimum 300 mots dans le champ body.`;

  try {
    const raw = await callOpenAI(apiKey, aiConfig.contentModel, systemPrompt, userPrompt);
    const parsed = parseContentJson(raw);
    return NextResponse.json({ ...parsed, targetPlan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'appel OpenAI";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
