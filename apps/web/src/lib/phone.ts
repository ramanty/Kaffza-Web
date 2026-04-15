export const E164_PHONE_RE = /^\+[1-9]\d{7,14}$/;

export function isValidE164Phone(value: string) {
  return E164_PHONE_RE.test((value || '').trim());
}
