const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function shiftLocalDateKey(value: string, days: number): string | null {
  const date = parseLocalDateKey(value);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}
