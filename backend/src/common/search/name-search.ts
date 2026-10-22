/** A query is cut to this many words: more is never typed by a person and would only grow the SQL */
export const MAX_SEARCH_WORDS = 5;

/** `contains` + `mode: 'insensitive'`: Prisma turns it into `ILIKE '%word%'` */
type Contains = { contains: string; mode: 'insensitive' };

/**
 * The words of a search box: split on whitespace, repeated words dropped (ignoring case), at most MAX_SEARCH_WORDS.
 * "  Иванов   иван ИВАН " -> ["Иванов", "иван"].
 */
export function searchWords(search: string | undefined): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const word of (search ?? '').split(/\s+/)) {
    const key = word.toLowerCase();
    if (word === '' || seen.has(key)) continue;
    seen.add(key);
    words.push(word);
    if (words.length === MAX_SEARCH_WORDS) break;
  }
  return words;
}

/**
 * Prisma `where` fragment for a "search by name" box.
 * EVERY word must be found, in ANY of the columns: "Иванов Иван" finds Иван Иванов, because "Иванов" is in the
 * last name and "Иван" in the first name. (Searching the whole phrase in each column, as before, found nobody.)
 * Each word is a substring match (ILIKE '%word%'); words of fewer than 3 letters cannot use the trigram index
 * and fall back to a scan, which is still fine at this table size.
 * An empty search gives an empty fragment (no filtering).
 */
export function buildNameSearch<Column extends string>(
  search: string | undefined,
  columns: readonly Column[],
): { AND?: { OR: Record<Column, Contains>[] }[] } {
  const words = searchWords(search);
  if (words.length === 0) return {};

  return {
    AND: words.map((word) => ({
      OR: columns.map((column) => ({ [column]: { contains: word, mode: 'insensitive' } }) as Record<Column, Contains>),
    })),
  };
}
