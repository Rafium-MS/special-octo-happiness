import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Company, Partner } from '../../types/entities';
import type { KanbanItem, ReceiptStage } from '../../types/entities';
import { useWaterDistributionController } from '../waterDistributionController';

vi.stubGlobal('IntersectionObserver', class {
  constructor(_: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
});

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

type NormalizedEntities<T extends { id: number }> = {
  byId: Record<number, T>;
  allIds: number[];
};

type NormalizedKanban = {
  items: Record<string, KanbanItem>;
  byStage: Record<ReceiptStage, string[]>;
};

type CompanyInput = {
  name: string;
  type: string;
  stores: number;
  totalValue: number;
  status: Company['status'];
  contact: Company['contact'];
};

type PartnerInput = {
  name: string;
  region: string;
  status: Partner['status'];
  receiptsStatus: Partner['receiptsStatus'];
  contact: Partner['contact'];
  cities: string[];
};

type StoreState = {
  companies: NormalizedEntities<Company>;
  partners: NormalizedEntities<Partner>;
  kanban: NormalizedKanban;
  status: { companies: LoadStatus; partners: LoadStatus; kanban: LoadStatus };
  errors: { companies: string | null; partners: string | null; kanban: string | null };
  fetchCompanies: () => Promise<void>;
  fetchPartners: () => Promise<void>;
  fetchKanban: () => Promise<void>;
  fetchAll: () => Promise<void>;
  createCompany: (input: CompanyInput) => Promise<Company>;
  updateCompany: (id: number, input: CompanyInput) => Promise<Company>;
  createPartner: (input: PartnerInput) => Promise<Partner>;
  updatePartner: (id: number, input: PartnerInput) => Promise<Partner>;
  moveKanbanItem: (key: string, nextStage: ReceiptStage) => Promise<KanbanItem>;
};

const createEntities = <T extends { id: number }>(items: T[]): NormalizedEntities<T> => ({
  byId: items.reduce<Record<number, T>>((acc, item) => ({ ...acc, [item.id]: item }), {}),
  allIds: items.map((item) => item.id)
});

const createKanban = (items: KanbanItem[] = []): NormalizedKanban => ({
  items: items.reduce<Record<string, KanbanItem>>((acc, item) => ({ ...acc, [item.key]: item }), {}),
  byStage: {
    recebimento: items.filter((item) => item.stage === 'recebimento').map((item) => item.key),
    relatorio: items.filter((item) => item.stage === 'relatorio').map((item) => item.key),
    nota_fiscal: items.filter((item) => item.stage === 'nota_fiscal').map((item) => item.key)
  }
});

const createDefaultState = (): StoreState => ({
  companies: createEntities([]),
  partners: createEntities([]),
  kanban: createKanban(),
  status: { companies: 'idle', partners: 'idle', kanban: 'idle' },
  errors: { companies: null, partners: null, kanban: null },
  fetchCompanies: async () => {},
  fetchPartners: async () => {},
  fetchKanban: async () => {},
  fetchAll: async () => {},
  createCompany: async () => {
    throw new Error('createCompany não mockado');
  },
  updateCompany: async () => {
    throw new Error('updateCompany não mockado');
  },
  createPartner: async () => {
    throw new Error('createPartner não mockado');
  },
  updatePartner: async () => {
    throw new Error('updatePartner não mockado');
  },
  moveKanbanItem: async () => {
    throw new Error('moveKanbanItem não mockado');
  }
});

const defaultState = createDefaultState();

let storeState: StoreState = createDefaultState();
const listeners = new Set<() => void>();

function baseUseWaterDataStore<T>(selector?: (state: StoreState) => T) {
  return selector ? selector(storeState) : (storeState as unknown as T);
}

function selectCompanies(state: StoreState) {
  return state.companies.allIds.map((id) => state.companies.byId[id]);
}

function selectPartners(state: StoreState) {
  return state.partners.allIds.map((id) => state.partners.byId[id]);
}

function selectKanbanColumns(state: StoreState) {
  return {
    recebimento: state.kanban.byStage.recebimento.map((key) => state.kanban.items[key]),
    relatorio: state.kanban.byStage.relatorio.map((key) => state.kanban.items[key]),
    nota_fiscal: state.kanban.byStage.nota_fiscal.map((key) => state.kanban.items[key])
  };
}

const setStoreState = (next: StoreState) => {
  storeState = next;
  listeners.forEach((listener) => listener());
};

vi.mock('../../store/useWaterDataStore', () => {
  const useWaterDataStore = baseUseWaterDataStore as unknown as {
    (): StoreState;
    <TSelected>(selector: (state: StoreState) => TSelected): TSelected;
    getState: () => StoreState;
    setState: (
      updater: Partial<StoreState> | ((state: StoreState) => Partial<StoreState>),
      replace?: boolean
    ) => void;
    subscribe: (listener: () => void) => () => void;
  };

  useWaterDataStore.getState = () => storeState;
  useWaterDataStore.setState = (updater, replace = false) => {
    const nextState = typeof updater === 'function' ? updater(storeState) : updater;
    storeState = replace
      ? (nextState as StoreState)
      : { ...storeState, ...(nextState as Partial<StoreState>) };
    listeners.forEach((listener) => listener());
  };
  useWaterDataStore.subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    useWaterDataStore,
    selectCompanies,
    selectPartners,
    selectKanbanColumns
  };
});

beforeEach(() => {
  storeState = createDefaultState();
  listeners.clear();
  setStoreState({ ...defaultState });
  if (!window.crypto) {
    Object.defineProperty(window, 'crypto', {
      value: {},
      configurable: true
    });
  }
  if (!window.crypto.randomUUID) {
    Object.defineProperty(window.crypto, 'randomUUID', {
      value: () => 'uuid',
      configurable: true
    });
  }
});

describe('useWaterDistributionController', () => {
  it('invokes fetchAll when all resources are idle', async () => {
    const fetchAll = vi.fn().mockResolvedValue(undefined);
    const state = createDefaultState();
    state.fetchAll = fetchAll;
    setStoreState(state);

    renderHook(() => useWaterDistributionController());

    await waitFor(() => {
      expect(fetchAll).toHaveBeenCalled();
    });
  });

  it('opens the company form in edit mode when editing a company', () => {
    const company: Company = {
      id: 1,
      name: 'Empresa Teste',
      type: 'Moda',
      stores: 3,
      storesByState: null,
      totalValue: 1200,
      status: 'ativo',
      contact: {
        name: 'Ana',
        phone: '(11) 90000-0001',
        email: 'ana@example.com'
      }
    };

    const state = createDefaultState();
    state.companies = createEntities([company]);
    setStoreState(state);

    const { result } = renderHook(() => useWaterDistributionController());

    act(() => {
      result.current.companies.actions.onEdit(company);
    });

    expect(result.current.dialogs.form.mode).toBe('edit');
    expect(result.current.dialogs.form.company).toEqual(company);
    expect(result.current.dialogs.form.companyInitialValues).toEqual(
      expect.objectContaining({
        name: company.name,
        type: company.type,
        stores: company.stores,
        totalValue: company.totalValue,
        status: company.status,
        contactName: company.contact.name,
        contactPhone: company.contact.phone,
        contactEmail: company.contact.email
      })
    );
  });
});

  it('submits company forms through the store action and shows a toast', async () => {
    const company: Company = {
      id: 1,
      name: 'Empresa Teste',
      type: 'Moda',
      stores: 5,
      storesByState: null,
      totalValue: 2000,
      status: 'ativo',
      contact: {
        name: 'Ana',
        phone: '(11) 91234-5678',
        email: 'ana@example.com'
      }
    };

    const createCompany = vi.fn().mockResolvedValue(company);
    const state = createDefaultState();
    state.createCompany = createCompany;
    setStoreState(state);

    const { result } = renderHook(() => useWaterDistributionController());

    await act(async () => {
      await result.current.dialogs.form.onSubmitCompany({
        name: company.name,
        type: company.type,
        stores: company.stores,
        totalValue: company.totalValue,
        status: company.status,
        contactName: company.contact.name,
        contactPhone: company.contact.phone,
        contactEmail: company.contact.email
      });
    });

    expect(createCompany).toHaveBeenCalledWith({
      name: company.name,
      type: company.type,
      stores: company.stores,
      totalValue: company.totalValue,
      status: company.status,
      contact: company.contact
    });

    expect(result.current.toasts.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: `Empresa ${company.name} cadastrada com sucesso.`,
          tone: 'success'
        })
      ])
    );
  });

  it('propagates company creation errors to the caller', async () => {
    const createCompany = vi.fn().mockRejectedValue(new Error('Falha ao salvar'));
    const state = createDefaultState();
    state.createCompany = createCompany;
    setStoreState(state);

    const { result } = renderHook(() => useWaterDistributionController());

    await expect(
      result.current.dialogs.form.onSubmitCompany({
        name: 'Nova',
        type: 'Moda',
        stores: 1,
        totalValue: 100,
        status: 'ativo',
        contactName: 'Ana',
        contactPhone: '(11) 90000-0000',
        contactEmail: 'ana@example.com'
      })
    ).rejects.toThrow('Falha ao salvar');

    expect(result.current.toasts.items).toHaveLength(0);
  });

  it('submits partner forms through the store action and shows a toast', async () => {
    const partner: Partner = {
      id: 10,
      name: 'Parceiro Teste',
      region: 'Sudeste',
      cities: ['São Paulo'],
      contact: {
        name: 'Carlos',
        phone: '(11) 95555-1111',
        email: 'carlos@example.com'
      },
      status: 'ativo',
      receiptsStatus: 'pendente'
    };

    const createPartner = vi.fn().mockResolvedValue(partner);
    const state = createDefaultState();
    state.createPartner = createPartner;
    setStoreState(state);

    const { result } = renderHook(() => useWaterDistributionController());

    await act(async () => {
      await result.current.dialogs.form.onSubmitPartner({
        name: partner.name,
        region: partner.region,
        status: partner.status,
        receiptsStatus: partner.receiptsStatus,
        contactName: partner.contact.name,
        contactPhone: partner.contact.phone,
        contactEmail: partner.contact.email,
        cities: partner.cities
      });
    });

    expect(createPartner).toHaveBeenCalledWith({
      name: partner.name,
      region: partner.region,
      status: partner.status,
      receiptsStatus: partner.receiptsStatus,
      contact: partner.contact,
      cities: partner.cities
    });

    expect(result.current.toasts.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: `Parceiro ${partner.name} cadastrado com sucesso.`,
          tone: 'success'
        })
      ])
    );
  });

  it('propagates partner creation errors to the caller', async () => {
    const createPartner = vi.fn().mockRejectedValue(new Error('Erro ao salvar parceiro'));
    const state = createDefaultState();
    state.createPartner = createPartner;
    setStoreState(state);

    const { result } = renderHook(() => useWaterDistributionController());

    await expect(
      result.current.dialogs.form.onSubmitPartner({
        name: 'Parceiro',
        region: 'Sul',
        status: 'ativo',
        receiptsStatus: 'pendente',
        contactName: 'João',
        contactPhone: '(11) 98888-0000',
        contactEmail: 'joao@example.com',
        cities: ['Curitiba']
      })
    ).rejects.toThrow('Erro ao salvar parceiro');

    expect(result.current.toasts.items).toHaveLength(0);
  });

  it('moves kanban items through the store action and shows a toast', async () => {
    const item: KanbanItem = {
      key: 'Empresa 1:recebimento',
      company: 'Empresa 1',
      stage: 'recebimento',
      receipts: 3,
      total: 1500
    };

    const updated: KanbanItem = { ...item, key: 'Empresa 1:relatorio', stage: 'relatorio' };
    const moveKanbanItem = vi.fn().mockResolvedValue(updated);

    const state = createDefaultState();
    state.kanban = createKanban([item]);
    state.moveKanbanItem = moveKanbanItem;
    setStoreState(state);

    const { result } = renderHook(() => useWaterDistributionController());

    await act(async () => {
      await result.current.kanban.onMoveStage(item);
    });

    expect(moveKanbanItem).toHaveBeenCalledWith(item.key, 'relatorio');
    expect(result.current.toasts.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Empresa Empresa 1 movida para "Relatório Preenchido".',
          tone: 'success'
        })
      ])
    );
  });

  it('shows an error toast when the kanban move fails', async () => {
    const item: KanbanItem = {
      key: 'Empresa 2:recebimento',
      company: 'Empresa 2',
      stage: 'recebimento',
      receipts: 1,
      total: 500
    };

    const moveKanbanItem = vi.fn().mockRejectedValue(new Error('Falha no pipeline'));
    const state = createDefaultState();
    state.kanban = createKanban([item]);
    state.moveKanbanItem = moveKanbanItem;
    setStoreState(state);

    const { result } = renderHook(() => useWaterDistributionController());

    await act(async () => {
      await result.current.kanban.onMoveStage(item);
    });

    expect(result.current.toasts.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Falha no pipeline',
          tone: 'error'
        })
      ])
    );
  });
