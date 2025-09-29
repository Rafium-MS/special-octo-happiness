import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import type { Company, KanbanItem, NormalizedEntities, NormalizedKanban, Partner } from '../../types/entities';

vi.mock('../../hooks/useThemePreference', () => ({
  useThemePreference: () => ({
    preference: 'light',
    resolvedTheme: 'light',
    setPreference: vi.fn()
  })
}));

vi.mock('../dashboard/StatCard', () => ({
  default: ({ label }: { label: string }) => <div data-testid={`stat-${label}`} />
}));

vi.mock('../common/PartnerCard', () => ({
  default: ({ partner }: { partner: Partner }) => (
    <div data-testid={`partner-${partner.id}`}>{partner.name}</div>
  )
}));

vi.mock('../common/ProgressBar', () => ({
  default: ({ value }: { value: number }) => <div data-testid="progress">{value}</div>
}));

vi.mock('../common/BadgeStatus', () => ({
  default: ({ label }: { label: string }) => <span>{label}</span>
}));

vi.mock('../common/ThemeToggle', () => ({
  default: ({ onChange }: { onChange: (value: string) => void }) => (
    <button type="button" onClick={() => onChange('light')}>
      Alternar tema
    </button>
  )
}));

vi.mock('../forms/CompanyForm', () => ({
  default: () => <div data-testid="company-form" />
}));

vi.mock('../forms/PartnerForm', () => ({
  default: () => <div data-testid="partner-form" />
}));

vi.mock('../ui/OverlayDialog', () => ({
  default: ({ isOpen, children, titleId }: { isOpen: boolean; children: ReactNode; titleId: string }) =>
    isOpen ? (
      <div role="dialog" aria-labelledby={titleId}>
        {children}
      </div>
    ) : null
}));

vi.mock('../common/ToolbarTabs', () => ({
  default: ({ tabs, onTabChange }: { tabs: Array<{ id: string; label: string }>; onTabChange: (tab: string) => void }) => (
    <div>
      {tabs.map((tab) => (
        <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}));

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

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
  createCompany: () => Promise<Company>;
  updateCompany: () => Promise<Company>;
  createPartner: () => Promise<Partner>;
  updatePartner: () => Promise<Partner>;
  moveKanbanItem: () => Promise<KanbanItem>;
};

const createEmptyEntities = <T extends { id: number }>(): NormalizedEntities<T> => ({
  byId: {},
  allIds: []
});

const createEmptyKanban = (): NormalizedKanban => ({
  items: {},
  byStage: {
    recebimento: [],
    relatorio: [],
    nota_fiscal: []
  }
});

vi.mock('../../store/useWaterDataStore', () => {
  let storeState: StoreState = {
    companies: createEmptyEntities<Company>(),
    partners: createEmptyEntities<Partner>(),
    kanban: createEmptyKanban(),
    status: { companies: 'success', partners: 'success', kanban: 'success' },
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
  };

  const listeners = new Set<() => void>();

  const useWaterDataStore = (<T,>(selector?: (state: StoreState) => T) =>
    selector ? selector(storeState) : (storeState as unknown as T)) as unknown as {
    (): StoreState;
    <TSelected>(selector: (state: StoreState) => TSelected): TSelected;
    getState: () => StoreState;
    setState: (updater: Partial<StoreState> | ((state: StoreState) => Partial<StoreState>), replace?: boolean) => void;
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

  const selectCompanies = (state: StoreState) =>
    state.companies.allIds.map((id) => state.companies.byId[id]);

  const selectPartners = (state: StoreState) =>
    state.partners.allIds.map((id) => state.partners.byId[id]);

  const selectKanbanColumns = (state: StoreState) => ({
    recebimento: state.kanban.byStage.recebimento.map((key) => state.kanban.items[key]),
    relatorio: state.kanban.byStage.relatorio.map((key) => state.kanban.items[key]),
    nota_fiscal: state.kanban.byStage.nota_fiscal.map((key) => state.kanban.items[key])
  });

  return {
    useWaterDataStore,
    selectCompanies,
    selectPartners,
    selectKanbanColumns,
    __setStoreState: (next: StoreState) => {
      storeState = next;
      listeners.forEach((listener) => listener());
    }
  };
});

import WaterDistributionSystem from '../WaterDistributionSystem';
import * as storeModule from '../../store/useWaterDataStore';

const { __setStoreState } = storeModule as unknown as {
  __setStoreState: (state: StoreState) => void;
};

const buildCompany = (id: number, overrides: Partial<Company> = {}): Company => {
  const base: Company = {
    id,
    name: `Empresa ${id}`,
    type: 'Moda',
    stores: 10,
    storesByState: null,
    totalValue: 1000,
    status: 'ativo',
    contact: {
      name: `Contato ${id}`,
      phone: `(11) 90000-000${id}`,
      email: `contato${id}@exemplo.com`
    }
  };

  return {
    ...base,
    ...overrides,
    contact: {
      ...base.contact,
      ...(overrides.contact ?? {})
    }
  };
};

const normalizeCompanies = (companies: Company[]): NormalizedEntities<Company> => {
  const byId: Record<number, Company> = {};
  const allIds: number[] = [];
  companies.forEach((company) => {
    byId[company.id] = company;
    allIds.push(company.id);
  });
  return { byId, allIds };
};

const createStoreState = (companies: Company[]): StoreState => ({
  companies: normalizeCompanies(companies),
  partners: createEmptyEntities<Partner>(),
  kanban: createEmptyKanban(),
  status: { companies: 'success', partners: 'success', kanban: 'success' },
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

const getTableRows = () => {
  const table = screen.getByRole('table');
  const tbody = table.querySelector('tbody');
  if (!tbody) {
    throw new Error('Tabela sem corpo');
  }
  return Array.from(tbody.querySelectorAll('tr')).filter((row) => row.querySelectorAll('td').length >= 6);
};

let intersectionCallbacks: Array<(entries: IntersectionObserverEntry[]) => void> = [];

beforeEach(() => {
  intersectionCallbacks = [];
  class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    observe = () => {
      intersectionCallbacks.push(this.callback);
    };
    unobserve = () => {};
    disconnect = () => {};
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  __setStoreState(createStoreState([]));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WaterDistributionSystem companies table', () => {
  it('filters companies by search term and status', async () => {
    const companies = [
      buildCompany(1, { name: 'Aquarius', contact: { name: 'Alice' } }),
      buildCompany(2, { name: 'Beta Distribuidora', status: 'inativo', contact: { name: 'Bruno' } })
    ];
    __setStoreState(createStoreState(companies));

    const user = userEvent.setup();
    render(<WaterDistributionSystem />);

    await user.click(screen.getByRole('button', { name: /Empresas/i }));

    await user.type(screen.getByLabelText(/Buscar/i), 'aqua');
    let rows = getTableRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Aquarius');

    await user.clear(screen.getByLabelText(/Buscar/i));
    await user.selectOptions(screen.getByLabelText(/Status/i), 'inativo');

    rows = getTableRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Beta Distribuidora');
  });

  it('allows sorting by stores in descending order', async () => {
    const companies = [
      buildCompany(1, { name: 'Atlas', stores: 5 }),
      buildCompany(2, { name: 'Boreal', stores: 20 }),
      buildCompany(3, { name: 'Cosmos', stores: 12 })
    ];
    __setStoreState(createStoreState(companies));

    const user = userEvent.setup();
    render(<WaterDistributionSystem />);

    await user.click(screen.getByRole('button', { name: /Empresas/i }));

    const storesButton = screen.getByRole('button', { name: /Lojas/i });
    await user.click(storesButton);
    await user.click(storesButton);

    const rows = getTableRows();
    expect(rows[0]).toHaveTextContent('Boreal');

    const storesHeader = screen.getByRole('columnheader', { name: /Lojas/i });
    expect(storesHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('increases pagination when the sentinel becomes visible', async () => {
    const companies = Array.from({ length: 12 }, (_, index) =>
      buildCompany(index + 1, { name: `Empresa ${String.fromCharCode(65 + index)}`, stores: index + 1 })
    );
    __setStoreState(createStoreState(companies));

    const user = userEvent.setup();
    render(<WaterDistributionSystem />);

    await user.click(screen.getByRole('button', { name: /Empresas/i }));

    expect(getTableRows()).toHaveLength(10);

    intersectionCallbacks.forEach((callback) =>
      callback([{ isIntersecting: true } as IntersectionObserverEntry])
    );

    await waitFor(() => {
      expect(getTableRows()).toHaveLength(12);
    });
  });
});
