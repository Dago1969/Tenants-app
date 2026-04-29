/**
 * Utility condivisa per separare la presentazione del prefisso internazionale dalla stringa telefono
 * persistita dal backend, senza cambiare il contratto delle API esistenti.
 */
export interface PhoneCountryOption {
  isoCode: string;
  dialCode: string;
  flag: string;
  label: string;
}

export interface PhoneInputState {
  countryDialCode: string;
  nationalNumber: string;
}

export const DEFAULT_PHONE_DIAL_CODE = '+39';

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { isoCode: 'IT', dialCode: '+39', flag: '🇮🇹', label: '🇮🇹 +39' },
  { isoCode: 'US', dialCode: '+1', flag: '🇺🇸', label: '🇺🇸 +1' },
  { isoCode: 'GB', dialCode: '+44', flag: '🇬🇧', label: '🇬🇧 +44' },
  { isoCode: 'FR', dialCode: '+33', flag: '🇫🇷', label: '🇫🇷 +33' },
  { isoCode: 'DE', dialCode: '+49', flag: '🇩🇪', label: '🇩🇪 +49' },
  { isoCode: 'ES', dialCode: '+34', flag: '🇪🇸', label: '🇪🇸 +34' },
  { isoCode: 'PT', dialCode: '+351', flag: '🇵🇹', label: '🇵🇹 +351' },
  { isoCode: 'CH', dialCode: '+41', flag: '🇨🇭', label: '🇨🇭 +41' },
  { isoCode: 'AT', dialCode: '+43', flag: '🇦🇹', label: '🇦🇹 +43' },
  { isoCode: 'BE', dialCode: '+32', flag: '🇧🇪', label: '🇧🇪 +32' },
  { isoCode: 'NL', dialCode: '+31', flag: '🇳🇱', label: '🇳🇱 +31' },
  { isoCode: 'IE', dialCode: '+353', flag: '🇮🇪', label: '🇮🇪 +353' },
  { isoCode: 'PL', dialCode: '+48', flag: '🇵🇱', label: '🇵🇱 +48' },
  { isoCode: 'RO', dialCode: '+40', flag: '🇷🇴', label: '🇷🇴 +40' },
  { isoCode: 'GR', dialCode: '+30', flag: '🇬🇷', label: '🇬🇷 +30' },
  { isoCode: 'HR', dialCode: '+385', flag: '🇭🇷', label: '🇭🇷 +385' },
  { isoCode: 'SI', dialCode: '+386', flag: '🇸🇮', label: '🇸🇮 +386' },
  { isoCode: 'RS', dialCode: '+381', flag: '🇷🇸', label: '🇷🇸 +381' },
  { isoCode: 'TR', dialCode: '+90', flag: '🇹🇷', label: '🇹🇷 +90' },
  { isoCode: 'UA', dialCode: '+380', flag: '🇺🇦', label: '🇺🇦 +380' },
  { isoCode: 'IN', dialCode: '+91', flag: '🇮🇳', label: '🇮🇳 +91' }
];

const PHONE_COUNTRY_OPTIONS_BY_LENGTH = [...PHONE_COUNTRY_OPTIONS].sort(
  (left, right) => right.dialCode.length - left.dialCode.length
);

export function createEmptyPhoneInputState(): PhoneInputState {
  return {
    countryDialCode: DEFAULT_PHONE_DIAL_CODE,
    nationalNumber: ''
  };
}

export function splitInternationalPhone(phoneNumber: string | null | undefined): PhoneInputState {
  const normalizedValue = normalizePhoneValue(phoneNumber);
  if (!normalizedValue) {
    return createEmptyPhoneInputState();
  }

  const matchingCountry = PHONE_COUNTRY_OPTIONS_BY_LENGTH.find((option) => normalizedValue.startsWith(option.dialCode));
  if (!matchingCountry) {
    return {
      countryDialCode: DEFAULT_PHONE_DIAL_CODE,
      nationalNumber: normalizedValue.startsWith('+') ? normalizedValue.slice(1) : normalizedValue
    };
  }

  return {
    countryDialCode: matchingCountry.dialCode,
    nationalNumber: normalizedValue.slice(matchingCountry.dialCode.length)
  };
}

export function buildInternationalPhone(state: PhoneInputState): string {
  const nationalNumber = sanitizeNationalNumber(state.nationalNumber);
  if (!nationalNumber) {
    return '';
  }

  const countryDialCode = state.countryDialCode || DEFAULT_PHONE_DIAL_CODE;
  return `${countryDialCode}${nationalNumber}`;
}

function normalizePhoneValue(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) {
    return '';
  }

  const trimmedValue = phoneNumber.trim();
  if (!trimmedValue) {
    return '';
  }

  const hasPlusPrefix = trimmedValue.startsWith('+');
  const digitsOnly = trimmedValue.replace(/\D/g, '');
  return digitsOnly ? `${hasPlusPrefix ? '+' : ''}${digitsOnly}` : '';
}

function sanitizeNationalNumber(value: string): string {
  return value.replace(/\D/g, '');
}
