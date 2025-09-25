export function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  const areaCode = digits.slice(0, 2);
  const middle = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
  const suffix = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${areaCode}) ${digits.slice(2)}`.trim();
  }

  if (digits.length <= 10) {
    return `(${areaCode}) ${middle}-${suffix}`.trim();
  }

  return `(${areaCode}) ${middle}-${suffix}`.trim();
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}
