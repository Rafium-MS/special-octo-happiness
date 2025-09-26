import type { Company } from '../../types/entities';
import type { RawCompany } from '../../types/ipc';
import { emptyContact, ensureValue } from './common';

export function parseStoresByState(raw: string | null): Record<string, number> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      const entries = Object.entries(parsed as Record<string, unknown>).reduce<Record<string, number>>(
        (acc, [state, value]) => {
          const numericValue = typeof value === 'number' ? value : Number(value);
          if (Number.isFinite(numericValue)) {
            acc[state] = Math.trunc(numericValue);
          }
          return acc;
        },
        {}
      );

      return Object.keys(entries).length > 0 ? entries : null;
    }
  } catch {
    // ignore malformed JSON
  }

  return null;
}

export function adaptCompany(raw: RawCompany): Company {
  return {
    id: raw.id,
    name: raw.name,
    type: ensureValue(raw.type, ''),
    stores: ensureValue(raw.stores, 0),
    storesByState: parseStoresByState(raw.stores_by_state_json),
    totalValue: Number(ensureValue(raw.total_value, 0)),
    status: ensureValue(raw.status, 'ativo'),
    contact: {
      name: ensureValue(raw.contact_name, emptyContact.name),
      phone: ensureValue(raw.contact_phone, emptyContact.phone),
      email: ensureValue(raw.contact_email, emptyContact.email)
    }
  };
}
