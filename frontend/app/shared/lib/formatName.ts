interface PersonName {
  lastName: string
  firstName: string
}

/**
 * "Иванов И." for a person, `fallback` when there is none.
 */
export function formatShortName(person: PersonName | null | undefined, fallback = 'Не указан'): string {
  if (!person) return fallback
  return `${person.lastName} ${person.firstName.charAt(0)}.`
}
