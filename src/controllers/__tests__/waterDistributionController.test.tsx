import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Company, Partner } from '../../services/dataService';
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
};

const createEntities = <T extends { id: number }>(items: T[]): NormalizedEntities<T> => ({
  byId: items.reduce<Record<number, T>>((acc, item) => ({ ...acc, [item.id]: item }), {}),
  allIds: items.map((item) => item.id)
});

const createKanban = (items: KanbanItem[] = []): NormalizedKanban => ({
  items: items.reduce<Record<string, KanbanItem>>((acc, item) => ({ ...acc, [item.company]: item }), {}),
  byStage: {
    recebimento: items.filter((item) => item.stage === 'recebimento').map((item) => item.company),
    relatorio: items.filter((item) => item.stage === 'relatorio').map((item) => item.company),
    nota_fiscal: items.filter((item) => item.stage === 'nota_fiscal').map((item) => item.company)
  }
});

const defaultState: StoreState = {
  companies: createEntities([]),
  partners: createEntities([]),
  kanban: createKanban(),
  status: { companies: 'idle', partners: 'idle', kanban: 'idle' },
  errors: { companies: null, partners: null, kanban: null },
  fetchCompanies: async () => {},
  fetchPartners: async () => {},
  fetchKanban: async () => {},
  fetchAll: async () => {}
};

let storeState: StoreState = { ...defaultState };
const listeners = new Set<() => void>();

const useWaterDataStore = (<T>(selector?: (state: StoreState) => T) =>
  selector ? selector(storeState) : (storeState as unknown as T)) as unknown as {
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
  storeState = replace ? (nextState as StoreState) : { ...storeState, ...(nextState as Partial<StoreState>) };
  listeners.forEach((listener) => listener());
};
useWaterDataStore.subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const selectCompanies = (state: StoreState) => state.companies.allIds.map((id) => state.companies.byId[id]);
const selectPartners = (state: StoreState) => state.partners.allIds.map((id) => state.partners.byId[id]);
const selectKanbanColumns = (state: StoreState) => ({
  recebimento: state.kanban.byStage.recebimento.map((key) => state.kanban.items[key]),
  relatorio: state.kanban.byStage.relatorio.map((key) => state.kanban.items[key]),
  nota_fiscal: state.kanban.byStage.nota_fiscal.map((key) => state.kanban.items[key])
});

const setStoreState = (next: StoreState) => {
  storeState = next;
  listeners.forEach((listener) => listener());
};

vi.mock('../../store/useWaterDataStore', () => ({
  useWaterDataStore,
  selectCompanies,
  selectPartners,
  selectKanbanColumns
}));

beforeEach(() => {
  storeState = { ...defaultState };
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
    setStoreState({
      ...defaultState,
      fetchAll
    });

    renderHook(() => useWaterDistributionController());

    await waitFor(() => {
      expect(fetchAll).toHaveBeenCalled();
    });
  });

  it('adds a toast when editing a company', () => {
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

    setStoreState({
      ...defaultState,
      companies: createEntities([company])
    });

    const { result } = renderHook(() => useWaterDistributionController());

    act(() => {
      result.current.companies.actions.onEdit(company);
    });

    expect(result.current.toasts.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Empresa Empresa Teste atualizada com sucesso.',
          tone: 'success'
        })
      ])
    );
  });
});
