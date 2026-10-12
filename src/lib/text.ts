/**
 * Pluralise a counted noun.
 *
 * N-18: the dashboard rendered "1 documents". Counts are interpolated in
 * several places, so the rule lives here rather than as a ternary at each one.
 */
export function plural(count: number, singular: string, pluralForm?: string): string {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}

/** "1 document" / "3 documents", with the count included. */
export function counted(count: number, singular: string, pluralForm?: string): string {
  return `${count.toLocaleString()} ${plural(count, singular, pluralForm)}`;
}
