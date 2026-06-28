import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { loadAiConfig, saveAiConfig } from "@/lib/ai-config-store";
import { DEFAULT_AI_CONFIG } from "@/lib/ai-config";

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const config = await loadAiConfig();
  return NextResponse.json({ config, defaults: DEFAULT_AI_CONFIG });
}

export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const allowed = [
    "contentModel",
    "assistantModel",
    "assistantPremiumModel",
    "contentSystemPromptExtra",
    "assistantSystemPromptExtra",
    "quotaLune",
    "quotaEtoile",
    "quotaSoleil",
    "aiContentEnabled",
    "aiAssistantEnabled",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucune mise à jour" }, { status: 400 });
  }

  const config = await saveAiConfig(updates, session.email);
  return NextResponse.json({ ok: true, config });
}
