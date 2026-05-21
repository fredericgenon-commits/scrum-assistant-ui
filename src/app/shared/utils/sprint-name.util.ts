/** Matches "<team>_<yy>_PIP<n>_S<n>" and captures year, pip, sprint number. */
export const SPRINT_NAME_RE = /_(\d{2})_PIP(\d+)_S(\d+)\b/;

/** Parses a sprint name into its (year, pip, sprint) parts, or null. */
export function parseSprintName(name: string | null | undefined):
  { year: number; pip: number; sprint: number } | null {
  const m = name?.match(SPRINT_NAME_RE);
  return m ? { year: +m[1], pip: +m[2], sprint: +m[3] } : null;
}
