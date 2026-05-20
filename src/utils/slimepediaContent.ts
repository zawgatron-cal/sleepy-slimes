export const UNDISCOVERED_COPY = '???';

/** Placeholder fusion-hint boxes shown before a species is discovered. */
export const UNDISCOVERED_FUSION_HINT_COUNT = 2;

export type SlimepediaEntry = {
  description?: string;
  fusionHint?: string;
  fusionHints?: string[];
};

export function getSlimepediaDescription(entry: SlimepediaEntry | undefined): string {
  const text = entry?.description?.trim();
  return text || 'No description yet.';
}

export function getSlimepediaFusionHints(entry: SlimepediaEntry | undefined): string[] {
  if (entry?.fusionHints?.length) {
    return entry.fusionHints.map((h) => h.trim()).filter(Boolean);
  }
  const single = entry?.fusionHint?.trim();
  if (single) {
    const parts = single.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts;
  }
  return ['No fusion hints yet.'];
}
