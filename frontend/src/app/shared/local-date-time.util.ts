function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toLocalDateTimeValue(date: Date): string {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join('-')
    + 'T'
    + [padDatePart(date.getHours()), padDatePart(date.getMinutes())].join(':');
}

export function formatQtmFlexibleDate(value: string | null | undefined): string {
  const parsed = toDate(value);
  return parsed ? parsed.toLocaleString('it-IT') : '';
}

export function formatQtmLocalDate(value: string | null | undefined): string {
  const parsed = toDate(value);
  return parsed ? parsed.toLocaleDateString('it-IT') : '';
}

export function getQtmCurrentDateInputValue(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    padDatePart(now.getMonth() + 1),
    padDatePart(now.getDate())
  ].join('-');
}

export function getQtmCurrentDateTimeLocalInputValue(): string {
  return toLocalDateTimeValue(new Date());
}

export function toQtmDateTimeLocalValue(value: string | null | undefined): string {
  const parsed = toDate(value);
  return parsed ? toLocalDateTimeValue(parsed) : '';
}

export function toQtmLocalDateTimePayload(value: string | null | undefined): string {
  return value?.trim() ?? '';
}