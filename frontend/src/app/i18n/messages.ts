
// Le traduzioni ora sono caricate solo dai file .properties tramite HttpClient o loader Angular.

const DEFAULT_LANGUAGE = 'it' as const;

export type Language = 'it' | 'en';
export type MessageKey = string;

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



// --- Simple .properties loader (browser only, sync at startup) ---
const translations: Record<Language, Record<string, string>> = { it: {}, en: {} };
let loaded = false;

function loadPropertiesSync(lang: Language) {
  const url = `/i18n/messages_${lang}.properties`;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, false); // sync
  xhr.send();
  if (xhr.status === 200) {
    const lines = xhr.responseText.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim() || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx > 0) {
        const k = line.substring(0, idx).trim();
        const v = line.substring(idx + 1).trim();
        translations[lang][k] = v;
      }
    }
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== 'undefined') {
    loadPropertiesSync('it');
    loadPropertiesSync('en');
    loaded = true;
  }
}

export function t(key: MessageKey): string {
  ensureLoaded();
  const lang = getCurrentLanguage();
  return (
    translations[lang][key] ||
    translations[DEFAULT_LANGUAGE][key] ||
    key
  );
}

export function hasMessageKey(key: string): key is MessageKey {
  return true;
}
