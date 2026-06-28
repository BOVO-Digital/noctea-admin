export const AI_CONTENT_BASE_PROMPT = `Tu es un expert en parentalité et développement de l'enfant. Tu génères du contenu pour l'app NOCTEA, destinée aux jeunes parents francophones.

Règles immuables (non modifiables) :
- Ton bienveillant, factuel, sans alarmisme
- Pas de diagnostic médical ni de prescription
- Pas de conseils dangereux (sommeil ventral non recommandé sans contexte professionnel, etc.)
- Langue française
- Adapte le niveau de détail au plan ciblé (lune=basique, etoile=avancé, soleil=premium expert)

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks).`;

export const DEFAULT_AI_CONFIG = {
  contentModel: "gpt-4o-mini",
  assistantModel: "gpt-4o-mini",
  assistantPremiumModel: "gpt-4o",
  contentSystemPromptExtra: `Le contenu doit rassurer les parents fatigués. Privilégie des conseils actionnables.`,
  assistantSystemPromptExtra: `Tu es l'assistant parental NOCTEA. Réponds en français, de façon concise et bienveillante.`,
  quotaLune: 5,
  quotaEtoile: -1,
  quotaSoleil: -1,
  aiContentEnabled: true,
  aiAssistantEnabled: true,
} as const;

export type AiConfig = {
  contentModel: string;
  assistantModel: string;
  assistantPremiumModel: string;
  contentSystemPromptExtra: string;
  assistantSystemPromptExtra: string;
  quotaLune: number;
  quotaEtoile: number;
  quotaSoleil: number;
  aiContentEnabled: boolean;
  aiAssistantEnabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

export function mergeAiConfig(data?: Partial<AiConfig> | null): AiConfig {
  return {
    contentModel: data?.contentModel ?? DEFAULT_AI_CONFIG.contentModel,
    assistantModel: data?.assistantModel ?? DEFAULT_AI_CONFIG.assistantModel,
    assistantPremiumModel:
      data?.assistantPremiumModel ?? DEFAULT_AI_CONFIG.assistantPremiumModel,
    contentSystemPromptExtra:
      data?.contentSystemPromptExtra ?? DEFAULT_AI_CONFIG.contentSystemPromptExtra,
    assistantSystemPromptExtra:
      data?.assistantSystemPromptExtra ?? DEFAULT_AI_CONFIG.assistantSystemPromptExtra,
    quotaLune: data?.quotaLune ?? DEFAULT_AI_CONFIG.quotaLune,
    quotaEtoile: data?.quotaEtoile ?? DEFAULT_AI_CONFIG.quotaEtoile,
    quotaSoleil: data?.quotaSoleil ?? DEFAULT_AI_CONFIG.quotaSoleil,
    aiContentEnabled: data?.aiContentEnabled ?? DEFAULT_AI_CONFIG.aiContentEnabled,
    aiAssistantEnabled: data?.aiAssistantEnabled ?? DEFAULT_AI_CONFIG.aiAssistantEnabled,
    updatedAt: data?.updatedAt,
    updatedBy: data?.updatedBy,
  };
}

export function buildContentSystemPrompt(extra: string, jsonSchema: string): string {
  return `${AI_CONTENT_BASE_PROMPT}

Instructions éditoriales (modifiables par l'équipe NOCTEA) :
${extra.trim()}

${jsonSchema}`;
}
