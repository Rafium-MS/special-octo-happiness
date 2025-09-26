import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adaptCompany,
  adaptKanbanItem,
  adaptPartner,
  fetchFromApi,
  normalizeEntities,
  type Company,
  type KanbanItem,
  type Partner
} from '../dataService';
import type { RawCompany, RawKanbanItem, RawPartner, WindowApi } from '../../types/ipc';

declare global {
  interface Window {
    api?: WindowApi;
  }
}

describe('dataService adapters', () => {
  it('adapts companies including stores by state and fallbacks', () => {
    const raw: RawCompany = {
      id: 1,
      name: 'ACME',
      type: null,
      stores: null,
      stores_by_state_json: '{"SP": 5, "RJ": "7"}',
      total_value: '1200.5' as unknown as number,
      status: null,
      contact_name: null,
      contact_phone: undefined,
      contact_email: undefined
    };

    const company = adaptCompany(raw);
    expect(company).toMatchObject<Partial<Company>>({
      id: 1,
      name: 'ACME',
      type: '',
      stores: 0,
      storesByState: { SP: 5, RJ: 7 },
      totalValue: 1200.5,
      status: 'ativo',
      contact: { name: '', phone: '', email: '' }
    });
  });

  it('returns null storesByState when JSON is invalid', () => {
    const raw: RawCompany = {
      id: 2,
      name: 'Broken',
      type: 'Tipo',
      stores: 10,
      stores_by_state_json: 'not-json',
      total_value: 5000,
      status: 'inativo',
      contact_name: 'Contato',
      contact_phone: '123',
      contact_email: 'mail@example.com'
    };

    expect(adaptCompany(raw).storesByState).toBeNull();
  });

  it('adapts partners parsing cities safely', () => {
    const raw: RawPartner = {
      id: 1,
      name: 'Partner',
      region: null,
      cities_json: '["A", "B"]',
      contact_name: null,
      contact_phone: undefined,
      contact_email: undefined,
      status: null,
      receipts_status: null
    };

    const partner = adaptPartner(raw);
    expect(partner).toMatchObject<Partial<Partner>>({
      id: 1,
      region: '',
      cities: ['A', 'B'],
      status: 'ativo',
      receiptsStatus: 'pendente'
    });
  });

  it('returns empty cities array for malformed JSON', () => {
    const raw: RawPartner = {
      id: 2,
      name: 'Partner',
      region: 'Nordeste',
      cities_json: 'oops',
      contact_name: 'Ana',
      contact_phone: '123',
      contact_email: 'ana@example.com',
      status: 'ativo',
      receipts_status: 'enviado'
    };

    expect(adaptPartner(raw).cities).toEqual([]);
  });

  it('creates kanban items with composite keys', () => {
    const raw: RawKanbanItem = { company: 'ACME', stage: 'recebimento', receipts: 5, total: 10 };
    const item = adaptKanbanItem(raw);
    expect(item).toEqual<KanbanItem>({
      key: 'ACME:recebimento',
      company: 'ACME',
      stage: 'recebimento',
      receipts: 5,
      total: 10
    });
  });
});

describe('normalizeEntities', () => {
  it('normalizes entity arrays by id', () => {
    const items = [
      { id: 2, value: 'b' },
      { id: 1, value: 'a' }
    ];

    const normalized = normalizeEntities(items);
    expect(normalized.allIds).toEqual([2, 1]);
    expect(normalized.byId[1]).toEqual({ id: 1, value: 'a' });
  });
});

describe('fetchFromApi', () => {
  const originalApi = window.api;

  beforeEach(() => {
    window.api = undefined;
  });

  afterEach(() => {
    window.api = originalApi;
    vi.restoreAllMocks();
  });

  it('returns fallback when api is unavailable', async () => {
    const fallback = ['fallback'];
    const result = await fetchFromApi(fallback, async () => ['remote']);
    expect(result).toBe(fallback);
  });

  it('returns fetched data when available', async () => {
    const fallback = ['fallback'];
    const loader = vi.fn().mockResolvedValue(['remote']);
    window.api = { companies: { list: vi.fn() } } as unknown as WindowApi;

    const result = await fetchFromApi(fallback, loader);
    expect(result).toEqual(['remote']);
    expect(loader).toHaveBeenCalledWith(window.api);
  });

  it('falls back when loader resolves to null or throws', async () => {
    const fallback = ['fallback'];
    const loader = vi.fn().mockResolvedValue(null);
    window.api = {} as WindowApi;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const nullResult = await fetchFromApi(fallback, loader);
    expect(nullResult).toBe(fallback);

    loader.mockRejectedValueOnce(new Error('boom'));
    const errorResult = await fetchFromApi(fallback, loader);
    expect(errorResult).toBe(fallback);
    expect(warnSpy).toHaveBeenCalled();
  });
});
