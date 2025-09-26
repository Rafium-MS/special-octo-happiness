import type { Partner } from '../../types/entities';
import type { RawPartner } from '../../types/ipc';
import { emptyContact, ensureValue } from './common';

export function adaptPartner(raw: RawPartner): Partner {
  let cities: string[] = [];
  try {
    const parsed = raw.cities_json ? JSON.parse(raw.cities_json) : [];
    cities = Array.isArray(parsed) ? parsed : [];
  } catch {
    cities = [];
  }

  return {
    id: raw.id,
    name: raw.name,
    region: ensureValue(raw.region, ''),
    cities,
    contact: {
      name: ensureValue(raw.contact_name, emptyContact.name),
      phone: ensureValue(raw.contact_phone, emptyContact.phone),
      email: ensureValue(raw.contact_email, emptyContact.email)
    },
    status: ensureValue(raw.status, 'ativo'),
    receiptsStatus: ensureValue(raw.receipts_status, 'pendente')
  };
}
