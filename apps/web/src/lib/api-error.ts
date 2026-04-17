export function extractApiErrorMessage(error: any, fallback: string): string {
  const raw = error?.response?.data?.message ?? error?.message;
  if (Array.isArray(raw)) {
    return raw.filter(Boolean).join('، ') || fallback;
  }
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (raw && typeof raw === 'object') return JSON.stringify(raw);
  return fallback;
}
