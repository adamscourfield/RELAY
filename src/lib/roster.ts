// Stand-in for a real school roster. RELAY is expected to become a module inside
// Anaxi, which owns the actual student/staff roster — this gives behaviour detection
// something to resolve names against until that integration exists. Swap `getRoster`
// for a real lookup (Anaxi API, shared student-ID scheme) and nothing else needs to change.
const POOL = ["Amara", "Jamal", "Priya", "Tom", "Sofia", "Leo", "Maya", "Ethan", "Zara", "Noah", "Ivy", "Kai", "Ruby", "Omar", "Ella", "Finn", "Aisha", "Sam", "Grace", "Theo", "Hana", "Max", "Lily", "Ravi", "Chloe", "Ben"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Every student on the roster for a class, keyed by year group/class name. Deterministic so the same class always gets the same list. */
export function getRoster(yearGroup: string): string[] {
  const key = yearGroup.trim().toLowerCase() || "unassigned";
  const start = hash(key) % POOL.length;
  const size = 22 + (hash(key + "n") % 6);
  const names: string[] = [];
  for (let i = 0; i < size; i++) names.push(POOL[(start + i) % POOL.length]);
  return names;
}

export interface NameResolution {
  match: string | null;
  candidates: string[];
}

/** Resolve a first name heard in the transcript against the class roster. */
export function resolveStudent(rawName: string, yearGroup: string): NameResolution {
  const roster = getRoster(yearGroup);
  const hits = roster.filter((n) => n.toLowerCase() === rawName.toLowerCase());
  if (hits.length === 1) return { match: hits[0], candidates: [] };
  if (hits.length > 1) return { match: null, candidates: hits };
  return { match: null, candidates: [] };
}
