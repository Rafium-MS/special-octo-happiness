import type { Company, KanbanItem, NormalizedEntities, NormalizedKanban, Partner } from '../types/entities';
import { companyRepository } from '../repositories/companyRepository';
import { kanbanRepository } from '../repositories/kanbanRepository';
import { partnerRepository } from '../repositories/partnerRepository';
import { RECEIPT_STAGES, type ReceiptStage } from '../types/entities';
import { createStore } from './createStore';
import type { KanbanPayload } from '../types/ipc';

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
  createCompany: (input: CompanyInput) => Promise<Company>;
  updateCompany: (id: number, input: CompanyInput) => Promise<Company>;
  deleteCompany: (id: number) => Promise<void>;
  createPartner: (input: PartnerInput) => Promise<Partner>;
  updatePartner: (id: number, input: PartnerInput) => Promise<Partner>;
  moveKanbanItem: (key: string, nextStage: ReceiptStage) => Promise<KanbanItem>;
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
  },
  async createCompany(input) {
    const payload = {
      name: input.name,
      type: input.type,
      stores: input.stores,
      total_value: input.totalValue,
      status: input.status,
      contact_name: input.contact.name,
      contact_phone: input.contact.phone,
      contact_email: input.contact.email
    } as const;

    const state = get();
    const fallbackId =
      state.companies.allIds.length > 0 ? Math.max(...state.companies.allIds) + 1 : 1;

    let id = fallbackId;

    if (window.api?.companies?.create) {
      const response = await window.api.companies.create(payload);
      if (!response || typeof response.id !== 'number') {
        throw new Error('Resposta inválida ao criar empresa.');
      }
      id = response.id;
    }

    const company: Company = {
      id,
      name: input.name,
      type: input.type,
      stores: input.stores,
      storesByState: null,
      totalValue: input.totalValue,
      status: input.status,
      contact: input.contact
    };

    set((current) => ({
      companies: {
        byId: { ...current.companies.byId, [company.id]: company },
        allIds: current.companies.allIds.includes(company.id)
          ? current.companies.allIds
          : [...current.companies.allIds, company.id]
      }
    }));

    return company;
  },
  async updateCompany(id, input) {
    const existing = get().companies.byId[id];
    if (!existing) {
      throw new Error('Empresa não encontrada.');
    }

    const payload = {
      id,
      name: input.name,
      type: input.type,
      stores: input.stores,
      total_value: input.totalValue,
      status: input.status,
      contact_name: input.contact.name,
      contact_phone: input.contact.phone,
      contact_email: input.contact.email
    } as const;

    if (window.api?.companies?.update) {
      const response = await window.api.companies.update(payload);
      if (!response || response.ok !== true) {
        throw new Error('Não foi possível atualizar a empresa.');
      }
    }

    const company: Company = {
      ...existing,
      name: input.name,
      type: input.type,
      stores: input.stores,
      totalValue: input.totalValue,
      status: input.status,
      contact: input.contact
    };

    set((current) => ({
      companies: {
        ...current.companies,
        byId: { ...current.companies.byId, [company.id]: company }
      }
    }));

    return company;
  },
  async deleteCompany(id) {
    const existing = get().companies.byId[id];
    if (!existing) {
      throw new Error('Empresa não encontrada.');
    }

    if (window.api?.companies?.delete) {
      const response = await window.api.companies.delete(id);
      if (!response || response.ok !== true) {
        throw new Error('Não foi possível excluir a empresa.');
      }
    }

    set((current) => {
      const { [id]: _removed, ...remaining } = current.companies.byId;
      return {
        companies: {
          byId: remaining,
          allIds: current.companies.allIds.filter((companyId) => companyId !== id)
        }
      };
    });
  },
  async createPartner(input) {
    const payload = {
      name: input.name,
      region: input.region,
      status: input.status,
      receipts_status: input.receiptsStatus,
      contact_name: input.contact.name,
      contact_phone: input.contact.phone,
      contact_email: input.contact.email,
      cities_json: JSON.stringify(input.cities)
    } as const;

    const state = get();
    const fallbackId =
      state.partners.allIds.length > 0 ? Math.max(...state.partners.allIds) + 1 : 1;

    let id = fallbackId;

    if (window.api?.partners?.create) {
      const response = await window.api.partners.create(payload);
      if (!response || typeof response.id !== 'number') {
        throw new Error('Resposta inválida ao criar parceiro.');
      }
      id = response.id;
    }

    const partner: Partner = {
      id,
      name: input.name,
      region: input.region,
      cities: input.cities,
      contact: input.contact,
      status: input.status,
      receiptsStatus: input.receiptsStatus
    };

    set((current) => ({
      partners: {
        byId: { ...current.partners.byId, [partner.id]: partner },
        allIds: current.partners.allIds.includes(partner.id)
          ? current.partners.allIds
          : [...current.partners.allIds, partner.id]
      }
    }));

    return partner;
  },
  async updatePartner(id, input) {
    const existing = get().partners.byId[id];
    if (!existing) {
      throw new Error('Parceiro não encontrado.');
    }

    const payload = {
      id,
      name: input.name,
      region: input.region,
      status: input.status,
      receipts_status: input.receiptsStatus,
      contact_name: input.contact.name,
      contact_phone: input.contact.phone,
      contact_email: input.contact.email,
      cities_json: JSON.stringify(input.cities)
    } as const;

    if (window.api?.partners?.update) {
      const response = await window.api.partners.update(payload);
      if (!response || response.ok !== true) {
        throw new Error('Não foi possível atualizar o parceiro.');
      }
    }

    const partner: Partner = {
      ...existing,
      name: input.name,
      region: input.region,
      cities: input.cities,
      contact: input.contact,
      status: input.status,
      receiptsStatus: input.receiptsStatus
    };

    set((current) => ({
      partners: {
        ...current.partners,
        byId: { ...current.partners.byId, [partner.id]: partner }
      }
    }));

    return partner;
  },
  async moveKanbanItem(key, nextStage) {
    const state = get();
    const existing = state.kanban.items[key];

    if (!existing) {
      throw new Error('Item do pipeline não encontrado.');
    }

    if (existing.stage === nextStage) {
      return existing;
    }

    const payload: KanbanPayload = {
      company: existing.company,
      stage: nextStage,
      receipts: existing.receipts,
      total: existing.total
    };

    if (window.api?.kanban?.upsert) {
      const response = await window.api.kanban.upsert(payload);
      if (!response || response.ok !== true) {
        throw new Error('Não foi possível mover o item no pipeline.');
      }
    }

    const nextKey = `${existing.company}:${nextStage}`;
    const updated: KanbanItem = { ...existing, key: nextKey, stage: nextStage };

    set((current) => {
      const { kanban } = current;
      const { [key]: _, ...otherItems } = kanban.items;

      const removeFromCurrent = kanban.byStage[existing.stage].filter((itemKey) => itemKey !== key);
      const addToNext = kanban.byStage[nextStage].filter((itemKey) => itemKey !== nextKey);

      return {
        kanban: {
          items: { ...otherItems, [nextKey]: updated },
          byStage: {
            ...kanban.byStage,
            [existing.stage]: removeFromCurrent,
            [nextStage]: [...addToNext, nextKey]
          }
        }
      };
    });

    return updated;
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
