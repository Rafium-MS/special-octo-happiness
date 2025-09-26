import type { Contact } from '../../types/entities';

type Nullable<T> = T | null | undefined;

export function ensureValue<T>(value: Nullable<T>, fallback: T): T {
  return value ?? fallback;
}

export const emptyContact: Contact = { name: '', phone: '', email: '' };
