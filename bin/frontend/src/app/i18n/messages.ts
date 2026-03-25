import { messages } from './messages.generated';

const DEFAULT_LANGUAGE = 'it' as const;

export type Language = keyof typeof messages;
export type MessageKey = keyof typeof messages.it;

const LANGUAGE_STORAGE_KEYS = ['app.language', 'language', 'lang'] as const;

function normalizeLanguage(language: string | null | undefined): Language {
  const candidate = (language ?? '').trim().toLowerCase();
  return candidate.startsWith('en') ? 'en' : DEFAULT_LANGUAGE;
}

function getStoredLanguage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  for (const key of LANGUAGE_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value) {
      return value;
    }
  }

  return null;
}

export function getCurrentLanguage(): Language {
  if (typeof document !== 'undefined' && document.documentElement.lang) {
    return normalizeLanguage(document.documentElement.lang);
  }

  const storedLanguage = getStoredLanguage();
  if (storedLanguage) {
    return normalizeLanguage(storedLanguage);
  }

  if (typeof navigator !== 'undefined') {
    return normalizeLanguage(navigator.language);
  }

  return DEFAULT_LANGUAGE;
}

export function t(key: MessageKey): string {
  const language = getCurrentLanguage();
  return messages[language][key] ?? messages[DEFAULT_LANGUAGE][key] ?? key;
}

export function hasMessageKey(key: string): key is MessageKey {
  return key in messages.it;
}
