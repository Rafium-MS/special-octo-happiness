import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWaterDataStore } from '../useWaterDataStore';
import type { Company, KanbanItem, Partner } from '../../types/entities';

const resetStore = () => {
  const state = useWaterDataStore.getState();
  useWaterDataStore.setState(
    {
      companies: { byId: {}, allIds: [] },
      partners: { byId: {}, allIds: [] },
      kanban: {
        items: {},
        byStage: {
          recebimento: [],
          relatorio: [],
          nota_fiscal: []
        }
      },
      status: state.status,
      errors: state.errors
    },
    false
  );
};

describe('useWaterDataStore model actions', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).api;
  });

  it('creates companies with fallback ids when IPC is unavailable', async () => {
    const input = {
      name: 'Empresa Fallback',
      type: 'Moda',
      stores: 3,
      totalValue: 1500,
      status: 'ativo' as Company['status'],
      contact: {
        name: 'Ana',
        phone: '(11) 90000-0000',
        email: 'ana@example.com'
      }
    };

    const created = await useWaterDataStore.getState().createCompany(input);

    expect(created.id).toBe(1);
    const state = useWaterDataStore.getState();
    expect(state.companies.byId[created.id]).toEqual(created);
    expect(state.companies.allIds).toContain(created.id);
  });

  it('creates companies using IPC ids when available', async () => {
    const create = vi.fn().mockResolvedValue({ id: 42 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).api = {
      companies: { create },
      partners: {},
      kanban: {}
    };

    const input = {
      name: 'Empresa IPC',
      type: 'Saúde',
      stores: 7,
      totalValue: 3200,
      status: 'ativo' as Company['status'],
      contact: {
        name: 'Bruno',
        phone: '(21) 98888-7777',
        email: 'bruno@example.com'
      }
    };

    const created = await useWaterDataStore.getState().createCompany(input);

    expect(create).toHaveBeenCalledWith({
      name: input.name,
      type: input.type,
      stores: input.stores,
      total_value: input.totalValue,
      status: input.status,
      contact_name: input.contact.name,
      contact_phone: input.contact.phone,
      contact_email: input.contact.email
    });
    expect(created.id).toBe(42);
    expect(useWaterDataStore.getState().companies.byId[42]).toEqual(created);
  });

  it('updates existing companies and persists the new values', async () => {
    const base: Company = {
      id: 5,
      name: 'Empresa Base',
      type: 'Serviços',
      stores: 2,
      storesByState: null,
      totalValue: 800,
      status: 'ativo',
      contact: {
        name: 'Carlos',
        phone: '(11) 95555-0000',
        email: 'carlos@example.com'
      }
    };

    useWaterDataStore.setState((state) => ({
      companies: {
        byId: { ...state.companies.byId, [base.id]: base },
        allIds: [...state.companies.allIds, base.id]
      }
    }));

    const update = vi.fn().mockResolvedValue({ ok: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).api = {
      companies: { update },
      partners: {},
      kanban: {}
    };

    const updated = await useWaterDataStore.getState().updateCompany(base.id, {
      name: 'Empresa Atualizada',
      type: 'Serviços',
      stores: 4,
      totalValue: 1200,
      status: 'ativo',
      contact: {
        name: 'Carla',
        phone: '(11) 97777-0000',
        email: 'carla@example.com'
      }
    });

    expect(update).toHaveBeenCalledWith({
      id: base.id,
      name: 'Empresa Atualizada',
      type: 'Serviços',
      stores: 4,
      total_value: 1200,
      status: 'ativo',
      contact_name: 'Carla',
      contact_phone: '(11) 97777-0000',
      contact_email: 'carla@example.com'
    });
    expect(updated.name).toBe('Empresa Atualizada');
    expect(useWaterDataStore.getState().companies.byId[base.id].contact.name).toBe('Carla');
  });

  it('creates partners and normalizes their state', async () => {
    const partnerInput = {
      name: 'Parceiro Norte',
      region: 'Norte',
      status: 'ativo' as Partner['status'],
      receiptsStatus: 'pendente' as Partner['receiptsStatus'],
      contact: {
        name: 'Daniela',
        phone: '(92) 91111-2222',
        email: 'daniela@example.com'
      },
      cities: ['Manaus']
    };

    const partner = await useWaterDataStore.getState().createPartner(partnerInput);

    expect(partner.id).toBe(1);
    const state = useWaterDataStore.getState();
    expect(state.partners.byId[partner.id]).toEqual(partner);
    expect(state.partners.allIds).toContain(partner.id);
  });

  it('moves kanban items across stages and updates the normalized structures', async () => {
    const item: KanbanItem = {
      key: 'Empresa Sul:recebimento',
      company: 'Empresa Sul',
      stage: 'recebimento',
      receipts: 2,
      total: 900
    };

    useWaterDataStore.setState({
      kanban: {
        items: { [item.key]: item },
        byStage: {
          recebimento: [item.key],
          relatorio: [],
          nota_fiscal: []
        }
      }
    });

    const upsert = vi.fn().mockResolvedValue({ ok: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).api = {
      companies: {},
      partners: {},
      kanban: { upsert }
    };

    const moved = await useWaterDataStore.getState().moveKanbanItem(item.key, 'relatorio');

    expect(upsert).toHaveBeenCalledWith({
      company: item.company,
      stage: 'relatorio',
      receipts: item.receipts,
      total: item.total
    });
    expect(moved.stage).toBe('relatorio');
    expect(moved.key).toBe('Empresa Sul:relatorio');

    const state = useWaterDataStore.getState();
    expect(state.kanban.items[item.key]).toBeUndefined();
    expect(state.kanban.items[moved.key]).toEqual(moved);
    expect(state.kanban.byStage.recebimento).not.toContain(item.key);
    expect(state.kanban.byStage.relatorio).toContain(moved.key);
  });
});
