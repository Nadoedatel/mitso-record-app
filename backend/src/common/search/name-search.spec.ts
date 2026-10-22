import { buildNameSearch, MAX_SEARCH_WORDS, searchWords } from './name-search';

describe('searchWords', () => {
  it('splits on any whitespace and trims', () => {
    expect(searchWords('  Иванов \t Иван\n')).toEqual(['Иванов', 'Иван']);
  });

  it('drops repeated words, ignoring case, and keeps the first spelling', () => {
    expect(searchWords('Иван иван ИВАН Петров')).toEqual(['Иван', 'Петров']);
  });

  it('keeps at most five words', () => {
    expect(searchWords('a1 b2 c3 d4 e5 f6 g7')).toHaveLength(MAX_SEARCH_WORDS);
  });

  it.each([undefined, '', '   ', '\n'])('is empty for %j', (value) => {
    expect(searchWords(value)).toEqual([]);
  });

  it('keeps short words: nothing is silently dropped from what the person typed', () => {
    expect(searchWords('а Ли')).toEqual(['а', 'Ли']);
  });
});

describe('buildNameSearch', () => {
  const columns = ['firstName', 'lastName'] as const;

  it('does not filter on an empty search', () => {
    expect(buildNameSearch(undefined, columns)).toEqual({});
    expect(buildNameSearch('   ', columns)).toEqual({});
  });

  it('one word: that word in any column', () => {
    expect(buildNameSearch('иван', columns)).toEqual({
      AND: [
        {
          OR: [
            { firstName: { contains: 'иван', mode: 'insensitive' } },
            { lastName: { contains: 'иван', mode: 'insensitive' } },
          ],
        },
      ],
    });
  });

  it('several words: every word must match, each in any column (AND of ORs)', () => {
    const where = buildNameSearch('Иванов Иван', columns);

    expect(where.AND).toHaveLength(2);
    expect(where.AND?.[0].OR.map((c) => Object.values(c)[0].contains)).toEqual(['Иванов', 'Иванов']);
    expect(where.AND?.[1].OR.map((c) => Object.values(c)[0].contains)).toEqual(['Иван', 'Иван']);
  });

  it('always searches ignoring case', () => {
    const modes = buildNameSearch('Иван', columns).AND?.flatMap((group) => group.OR.map((c) => Object.values(c)[0].mode));
    expect(modes).toEqual(['insensitive', 'insensitive']);
  });
});
