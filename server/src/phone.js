import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { config } from './config.js';
export function normalizePhone(input) {
  const p = parsePhoneNumberFromString(String(input || ''), config.defaultCountry);
  return p && p.isValid() ? p.number : null;
}
