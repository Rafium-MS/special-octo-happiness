import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMockCompanies, getMockKanban, getMockPartners } from '../../data/fixtures';
import { createCompanyRepository } from '../companyRepository';
import { createKanbanRepository } from '../kanbanRepository';
import { createPartnerRepository } from '../partnerRepository';
import { fetchWithFallback } from '../utils';
import type { WindowApi } from '../../types/ipc';

const originalApi = window.api;

afterEach(() => {
  window.api = originalApi;
  vi.restoreAllMocks();
});

describe('fetchWithFallback', () => {
  it('returns fallback when api is unavailable', async () => {
    const fallback = ['fallback'];
    const result = await fetchWithFallback(fallback, async () => ['remote'], { api: null });
    expect(result).toBe(fallback);
  });

  it('returns fetched data when available', async () => {
    const fallback = ['fallback'];
    const loader = vi.fn().mockResolvedValue(['remote']);
    const api = { companies: { list: vi.fn() } } as unknown as WindowApi;

    const result = await fetchWithFallback(fallback, loader, { api });
    expect(result).toEqual(['remote']);
    expect(loader).toHaveBeenCalledWith(api);
  });

  it('falls back when loader resolves to null or throws', async () => {
    const fallback = ['fallback'];
    const loader = vi.fn().mockResolvedValue(null);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const api = {} as WindowApi;

    const nullResult = await fetchWithFallback(fallback, loader, { api });
    expect(nullResult).toBe(fallback);

    loader.mockRejectedValueOnce(new Error('boom'));
    const errorResult = await fetchWithFallback(fallback, loader, { api });
    expect(errorResult).toBe(fallback);
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('companyRepository', () => {
  it('returns normalized companies from fallback data', async () => {
    const fallback = getMockCompanies();
    const repository = createCompanyRepository({ api: null, fallback });
    const result = await repository.list();
    expect(result.allIds).toEqual(fallback.map((company) => company.id));
    expect(repository.createEmpty()).toEqual({ byId: {}, allIds: [] });
  });

  it('maps api data when available', async () => {
    const apiData = [
      {
        id: 10,
        name: 'Remote',
        type: 'Type',
        stores: 5,
        stores_by_state_json: null,
        total_value: 1000,
        status: 'ativo',
        contact_name: 'Ana',
        contact_phone: '123',
        contact_email: 'ana@example.com',
      },
    ];

    const api = {
      companies: {
        list: vi.fn().mockResolvedValue(apiData),
      },
    } as unknown as WindowApi;

    const repository = createCompanyRepository({ api });
    const result = await repository.list();
    expect(result.byId[10]?.name).toBe('Remote');
  });
});

describe('partnerRepository', () => {
  it('returns normalized partners from fallback data', async () => {
    const fallback = getMockPartners();
    const repository = createPartnerRepository({ api: null, fallback });
    const result = await repository.list();
    expect(result.allIds).toEqual(fallback.map((partner) => partner.id));
    expect(repository.createEmpty()).toEqual({ byId: {}, allIds: [] });
  });

  it('maps api data when available', async () => {
    const apiData = [
      {
        id: 20,
        name: 'Remote Partner',
        region: 'Sul',
        cities_json: '["Porto Alegre"]',
        contact_name: 'Carlos',
        contact_phone: '111',
        contact_email: 'carlos@example.com',
        status: 'ativo',
        receipts_status: 'enviado',
      },
    ];

    const api = {
      partners: {
        list: vi.fn().mockResolvedValue(apiData),
      },
    } as unknown as WindowApi;

    const repository = createPartnerRepository({ api });
    const result = await repository.list();
    expect(result.byId[20]?.cities).toEqual(['Porto Alegre']);
  });
});

describe('kanbanRepository', () => {
  it('returns normalized kanban from fallback data', async () => {
    const fallback = getMockKanban();
    const repository = createKanbanRepository({ api: null, fallback });
    const result = await repository.list();
    expect(result.byStage.recebimento.length).toBeGreaterThan(0);
    expect(repository.createEmpty()).toEqual({
      items: {},
      byStage: {
        recebimento: [],
        relatorio: [],
        nota_fiscal: [],
      },
    });
  });

  it('maps api data when available', async () => {
    const apiData = [
      { company: 'Remote Co', stage: 'nota_fiscal', receipts: 1, total: 1 },
    ];

    const api = {
      kanban: {
        list: vi.fn().mockResolvedValue(apiData),
      },
    } as unknown as WindowApi;

    const repository = createKanbanRepository({ api });
    const result = await repository.list();
    expect(result.byStage.nota_fiscal).toEqual(['Remote Co:nota_fiscal']);
  });
});
