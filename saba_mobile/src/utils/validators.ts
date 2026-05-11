export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function minLength(value: string, len: number) {
  return value.trim().length >= len;
}

export function isNonEmpty(value: string) {
  return value.trim().length > 0;
}
