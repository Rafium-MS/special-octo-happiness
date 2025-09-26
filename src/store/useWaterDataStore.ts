import type { Company, KanbanItem, NormalizedEntities, NormalizedKanban, Partner } from '../types/entities';
import { companyRepository } from '../repositories/companyRepository';
import { kanbanRepository } from '../repositories/kanbanRepository';
import { partnerRepository } from '../repositories/partnerRepository';
import { RECEIPT_STAGES, type ReceiptStage } from '../types/entities';
import { createStore } from './createStore';

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

type WaterDataState = {
  companies: NormalizedEntities<Company>;
  partners: NormalizedEntities<Partner>;
  kanban: NormalizedKanban;
  status: {
    companies: LoadStatus;
    partners: LoadStatus;
    kanban: LoadStatus;
  };
  errors: {
    companies: string | null;
    partners: string | null;
    kanban: string | null;
  };
  fetchCompanies: () => Promise<void>;
  fetchPartners: () => Promise<void>;
  fetchKanban: () => Promise<void>;
  fetchAll: () => Promise<void>;
};

function setLoading(state: WaterDataState, key: keyof WaterDataState['status']): WaterDataState {
  return {
    ...state,
    status: { ...state.status, [key]: 'loading' },
    errors: { ...state.errors, [key]: null }
  };
}

function setSuccess(
  state: WaterDataState,
  key: keyof WaterDataState['status'],
  data: Partial<Pick<WaterDataState, 'companies' | 'partners' | 'kanban'>>
): WaterDataState {
  return {
    ...state,
    ...data,
    status: { ...state.status, [key]: 'success' }
  };
}

function setError(
  state: WaterDataState,
  key: keyof WaterDataState['status'],
  message: string
): WaterDataState {
  return {
    ...state,
    status: { ...state.status, [key]: 'error' },
    errors: { ...state.errors, [key]: message }
  };
}

export const useWaterDataStore = createStore<WaterDataState>((set, get) => ({
  companies: companyRepository.createEmpty(),
  partners: partnerRepository.createEmpty(),
  kanban: kanbanRepository.createEmpty(),
  status: {
    companies: 'idle',
    partners: 'idle',
    kanban: 'idle'
  },
  errors: {
    companies: null,
    partners: null,
    kanban: null
  },
  async fetchCompanies() {
    set((state) => setLoading(state, 'companies'));
    try {
      const companies = await companyRepository.list();
      set((state) => setSuccess(state, 'companies', { companies }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar as empresas.';
      set((state) => setError(state, 'companies', message));
    }
  },
  async fetchPartners() {
    set((state) => setLoading(state, 'partners'));
    try {
      const partners = await partnerRepository.list();
      set((state) => setSuccess(state, 'partners', { partners }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar os parceiros.';
      set((state) => setError(state, 'partners', message));
    }
  },
  async fetchKanban() {
    set((state) => setLoading(state, 'kanban'));
    try {
      const kanban = await kanbanRepository.list();
      set((state) => setSuccess(state, 'kanban', { kanban }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar o pipeline.';
      set((state) => setError(state, 'kanban', message));
    }
  },
  async fetchAll() {
    const promises = [get().fetchCompanies(), get().fetchPartners(), get().fetchKanban()];
    await Promise.all(promises);
  }
}));

export const selectCompanies = (state: WaterDataState): Company[] =>
  state.companies.allIds.map((id) => state.companies.byId[id]);

export const selectPartners = (state: WaterDataState): Partner[] =>
  state.partners.allIds.map((id) => state.partners.byId[id]);

export const selectKanbanColumns = (
  state: WaterDataState
): Record<ReceiptStage, KanbanItem[]> =>
  RECEIPT_STAGES.reduce<Record<ReceiptStage, KanbanItem[]>>((columns, stage) => {
    columns[stage] = state.kanban.byStage[stage].map((key) => state.kanban.items[key]);
    return columns;
  }, {} as Record<ReceiptStage, KanbanItem[]>);
