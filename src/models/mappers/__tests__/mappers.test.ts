import { describe, expect, it } from 'vitest';
import type { RawCompany, RawKanbanItem, RawPartner } from '../../../types/ipc';
import {
  adaptCompany,
  adaptKanbanItem,
  adaptPartner,
  createEmptyEntities,
  createEmptyKanban,
  normalizeEntities,
  normalizeKanban,
} from '../index';

describe('entity mappers', () => {
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
      contact_email: undefined,
    };

    const company = adaptCompany(raw);
    expect(company).toMatchObject({
      id: 1,
      name: 'ACME',
      type: '',
      stores: 0,
      storesByState: { SP: 5, RJ: 7 },
      totalValue: 1200.5,
      status: 'ativo',
      contact: { name: '', phone: '', email: '' },
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
      contact_email: 'mail@example.com',
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
      receipts_status: null,
    };

    const partner = adaptPartner(raw);
    expect(partner).toMatchObject({
      id: 1,
      region: '',
      cities: ['A', 'B'],
      status: 'ativo',
      receiptsStatus: 'pendente',
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
      receipts_status: 'enviado',
    };

    expect(adaptPartner(raw).cities).toEqual([]);
  });

  it('creates kanban items with composite keys', () => {
    const raw: RawKanbanItem = { company: 'ACME', stage: 'recebimento', receipts: 5, total: 10 };
    const item = adaptKanbanItem(raw);
    expect(item).toEqual({
      key: 'ACME:recebimento',
      company: 'ACME',
      stage: 'recebimento',
      receipts: 5,
      total: 10,
    });
  });
});

describe('normalizeEntities', () => {
  it('normalizes entity arrays by id', () => {
    const items = [
      { id: 2, value: 'b' },
      { id: 1, value: 'a' },
    ];

    const normalized = normalizeEntities(items);
    expect(normalized.allIds).toEqual([2, 1]);
    expect(normalized.byId[1]).toEqual({ id: 1, value: 'a' });
  });

  it('creates empty normalized entities', () => {
    expect(createEmptyEntities<{ id: number }>()).toEqual({ byId: {}, allIds: [] });
  });
});

describe('normalizeKanban', () => {
  it('normalizes kanban items by stage and key', () => {
    const items = [
      { key: 'A:recebimento', company: 'A', stage: 'recebimento', receipts: 1, total: 2 },
      { key: 'A:relatorio', company: 'A', stage: 'relatorio', receipts: 2, total: 3 },
    ];

    const normalized = normalizeKanban(items);
    expect(normalized.items['A:recebimento']).toEqual(items[0]);
    expect(normalized.byStage.recebimento).toEqual(['A:recebimento']);
  });

  it('creates empty kanban structures', () => {
    const empty = createEmptyKanban();
    expect(empty).toEqual({
      items: {},
      byStage: {
        recebimento: [],
        relatorio: [],
        nota_fiscal: [],
      },
    });
  });
});
