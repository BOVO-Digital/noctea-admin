/**
 * Convertit récursivement les Timestamps Firestore en chaînes ISO
 * afin d'obtenir un objet JSON sérialisable.
 */
export function serializeDoc(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = serializeValue(value);
  }
  return result;
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Firestore Timestamp (instance avec toDate())
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  // Firestore Timestamp sérialisé { _seconds, _nanoseconds }
  if (
    typeof value === "object" &&
    value !== null &&
    "_seconds" in value &&
    "_nanoseconds" in value
  ) {
    const ts = value as { _seconds: number; _nanoseconds: number };
    return new Date(ts._seconds * 1000).toISOString();
  }

  // Tableau
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  // Objet imbriqué
  if (typeof value === "object") {
    return serializeDoc(value as Record<string, unknown>);
  }

  return value;
}
