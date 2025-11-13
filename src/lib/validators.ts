// src/lib/validators.ts
export function isValidEmail(email?: string) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function normalizePhone(raw?: string) {
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  return digits;
}

export function isValidPhone(digits?: string) {
  if (!digits) return false;
  // Aceptá 8-15 dígitos
  return /^\d{8,15}$/.test(digits);
}
