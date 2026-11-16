/**
 * Walk ancestor chain (child → parent map). Returns true if `nodeId`
 * appears while walking from `startParentId` upward (cycle if used as parent).
 */
export function wouldCreateLocationCycle(
  nodeId: string,
  startParentId: string | null | undefined,
  parentById: Map<string, string | null>,
): boolean {
  if (!startParentId) {
    return false;
  }
  let current: string | null | undefined = startParentId;
  const seen = new Set<string>();
  while (current) {
    if (current === nodeId) {
      return true;
    }
    if (seen.has(current)) {
      return true;
    }
    seen.add(current);
    current = parentById.get(current) ?? null;
  }
  return false;
}
