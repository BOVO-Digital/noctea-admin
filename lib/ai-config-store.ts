import { adminDb } from "@/lib/firebase-admin";
import { mergeAiConfig, type AiConfig } from "@/lib/ai-config";

const AI_CONFIG_DOC = "settings/ai";

export async function loadAiConfig(): Promise<AiConfig> {
  const snap = await adminDb.doc(AI_CONFIG_DOC).get();
  if (!snap.exists) return mergeAiConfig(null);
  return mergeAiConfig(snap.data() as Partial<AiConfig>);
}

export async function saveAiConfig(
  updates: Partial<AiConfig>,
  updatedBy: string
): Promise<AiConfig> {
  const current = await loadAiConfig();
  const merged = mergeAiConfig({ ...current, ...updates, updatedBy });
  await adminDb.doc(AI_CONFIG_DOC).set(
    {
      ...merged,
      updatedAt: new Date().toISOString(),
      updatedBy,
    },
    { merge: true }
  );
  return merged;
}
