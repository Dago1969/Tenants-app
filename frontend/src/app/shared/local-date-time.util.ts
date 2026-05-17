export function parseQtmLocalDateTime(value?: string | null): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})?$/
  );

  if (match) {
    const [, year, month, day, hours = '00', minutes = '00', seconds = '00'] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds)
    );
  }

  const parsedDate = new Date(trimmedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function formatQtmLocalDate(value?: string | null): string {
  const parsedDate = parseQtmLocalDateTime(value);
  if (!parsedDate) {
    return '';
  }

  return `${pad(parsedDate.getDate())}/${pad(parsedDate.getMonth() + 1)}/${parsedDate.getFullYear()}`;
}

export function formatQtmLocalTime(value?: string | null, separator = ':'): string {
  const parsedDate = parseQtmLocalDateTime(value);
  if (!parsedDate) {
    return '';
  }

  return `${pad(parsedDate.getHours())}${separator}${pad(parsedDate.getMinutes())}`;
}

export function formatQtmLocalDateTime(value?: string | null, timeSeparator = '.'): string {
  const parsedDate = parseQtmLocalDateTime(value);
  if (!parsedDate) {
    return '';
  }

  return `${formatQtmLocalDate(value)} ${formatQtmLocalTime(value, timeSeparator)}`;
}

export function formatQtmFlexibleDate(value?: string | null): string {
  if (!value?.trim()) {
    return '';
  }

  return hasTimeComponent(value)
    ? formatQtmLocalDateTime(value)
    : formatQtmLocalDate(value);
}

export function getQtmDurationInMinutes(start?: string | null, end?: string | null): number {
  const startDate = parseQtmLocalDateTime(start);
  const endDate = parseQtmLocalDateTime(end);
  if (!startDate || !endDate) {
    return 0;
  }

  return Math.round((endDate.getTime() - startDate.getTime()) / 60000);
}

export function getQtmDayOfMonth(value?: string | null): number | null {
  const parsedDate = parseQtmLocalDateTime(value);
  return parsedDate ? parsedDate.getDate() : null;
}

export function toQtmDateTimeLocalValue(value?: string | null): string {
  const parsedDate = parseQtmLocalDateTime(value);
  if (!parsedDate) {
    return '';
  }

  return `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth() + 1)}-${pad(parsedDate.getDate())}T${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}`;
}

export function toQtmLocalDateTimePayload(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

export function getQtmCurrentDateInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function getQtmCurrentDateTimeLocalInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function getQtmCurrentLocalDateTimePayload(): string {
  return toQtmLocalDateTimePayload(getQtmCurrentDateTimeLocalInputValue());
}

export function addMinutesToQtmDateTimeLocalValue(value: string, minutes: number): string {
  const parsedDate = parseQtmLocalDateTime(value);
  if (!parsedDate) {
    return '';
  }

  const endDate = new Date(parsedDate.getTime() + minutes * 60000);
  return `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
}

function hasTimeComponent(value: string): boolean {
  return value.includes('T') || /\d{2}:\d{2}/.test(value);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}