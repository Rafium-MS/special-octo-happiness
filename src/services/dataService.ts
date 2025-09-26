import type { RawCompany, RawKanbanItem, RawPartner, WindowApi } from '../types/ipc';
import {
  Company,
  Contact,
  KanbanItem,
  NormalizedEntities,
  NormalizedKanban,
  Partner,
  RECEIPT_STAGES,
  ReceiptStage,
} from '../types/entities';

export type {
  Company,
  Partner,
  KanbanItem,
  NormalizedEntities,
  NormalizedKanban,
} from '../types/entities';

const emptyContact: Contact = { name: '', phone: '', email: '' };

const fallbackCompanies: RawCompany[] = [
  {
    id: 1,
    name: 'ANIMALE',
    type: 'Moda Feminina',
    stores: 89,
    stores_by_state_json: JSON.stringify({
      SP: 25,
      RJ: 18,
      MG: 15,
      PR: 10,
      RS: 8,
      Outros: 13,
    }),
    total_value: 15420.5,
    status: 'ativo',
    contact_name: 'Maria Silva',
    contact_phone: '(11) 99999-9999',
    contact_email: 'contato@animale.com.br'
  },
  {
    id: 2,
    name: 'AREZZO',
    type: 'Calçados e Acessórios',
    stores: 14,
    stores_by_state_json: null,
    total_value: 8350.75,
    status: 'ativo',
    contact_name: 'João Santos',
    contact_phone: '(11) 88888-8888',
    contact_email: 'parceria@arezzo.com.br'
  },
  {
    id: 3,
    name: 'BAGAGGIO',
    type: 'Artefatos de Couro',
    stores: 29,
    stores_by_state_json: JSON.stringify({
      SP: 12,
      RJ: 7,
      MG: 4,
      ES: 3,
      Outros: 3,
    }),
    total_value: 12200.25,
    status: 'ativo',
    contact_name: 'Ana Costa',
    contact_phone: '(11) 77777-7777',
    contact_email: 'suprimentos@bagaggio.com.br'
  }
];

const fallbackPartners: RawPartner[] = [
  {
    id: 1,
    name: 'Águas do Sul Ltda',
    region: 'Sul',
    cities_json: JSON.stringify(['Porto Alegre', 'Curitiba', 'Florianópolis']),
    contact_name: 'Carlos Mendes',
    contact_phone: '(51) 99999-0001',
    contact_email: 'carlos@aguasdosul.com.br',
    status: 'ativo',
    receipts_status: 'enviado'
  },
  {
    id: 2,
    name: 'Distribuição Nordeste',
    region: 'Nordeste',
    cities_json: JSON.stringify(['Salvador', 'Recife', 'Fortaleza']),
    contact_name: 'Paula Oliveira',
    contact_phone: '(71) 99999-0002',
    contact_email: 'paula@distribnordeste.com.br',
    status: 'ativo',
    receipts_status: 'pendente'
  },
  {
    id: 3,
    name: 'SP Águas Express',
    region: 'Sudeste',
    cities_json: JSON.stringify(['São Paulo', 'Campinas', 'Santos']),
    contact_name: 'Roberto Lima',
    contact_phone: '(11) 99999-0003',
    contact_email: 'roberto@spaguas.com.br',
    status: 'ativo',
    receipts_status: 'enviado'
  }
];

const fallbackKanban: RawKanbanItem[] = [
  { company: 'ANIMALE', stage: 'recebimento', receipts: 45, total: 89 },
  { company: 'AREZZO', stage: 'relatorio', receipts: 14, total: 14 },
  { company: 'BAGAGGIO', stage: 'nota_fiscal', receipts: 29, total: 29 },
  { company: 'CLARO', stage: 'recebimento', receipts: 123, total: 156 },
  { company: 'DAISO', stage: 'relatorio', receipts: 67, total: 67 }
];

function ensureValue<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

function parseStoresByState(raw: string | null): Record<string, number> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      const entries = Object.entries(parsed as Record<string, unknown>).reduce<Record<string, number>>(
        (acc, [state, value]) => {
          const numericValue = typeof value === 'number' ? value : Number(value);
          if (Number.isFinite(numericValue)) {
            acc[state] = Math.trunc(numericValue);
          }
          return acc;
        },
        {}
      );

      return Object.keys(entries).length > 0 ? entries : null;
    }
  } catch {
    // ignore malformed JSON
  }

  return null;
}

function adaptCompany(raw: RawCompany): Company {
  return {
    id: raw.id,
    name: raw.name,
    type: ensureValue(raw.type, ''),
    stores: ensureValue(raw.stores, 0),
    storesByState: parseStoresByState(raw.stores_by_state_json),
    totalValue: Number(ensureValue(raw.total_value, 0)),
    status: ensureValue(raw.status, 'ativo'),
    contact: {
      name: ensureValue(raw.contact_name, emptyContact.name),
      phone: ensureValue(raw.contact_phone, emptyContact.phone),
      email: ensureValue(raw.contact_email, emptyContact.email)
    }
  };
}

function adaptPartner(raw: RawPartner): Partner {
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

function adaptKanbanItem(raw: RawKanbanItem): KanbanItem {
  const key = `${raw.company}:${raw.stage}`;
  return {
    key,
    company: raw.company,
    stage: raw.stage,
    receipts: raw.receipts,
    total: raw.total
  };
}

function normalizeEntities<T extends { id: number }>(items: T[]): NormalizedEntities<T> {
  return items.reduce<NormalizedEntities<T>>(
    (acc, item) => {
      acc.byId[item.id] = item;
      acc.allIds.push(item.id);
      return acc;
    },
    { byId: {}, allIds: [] }
  );
}

function createEmptyStageMap(): Record<ReceiptStage, string[]> {
  return RECEIPT_STAGES.reduce<Record<ReceiptStage, string[]>>((acc, stage) => {
    acc[stage] = [];
    return acc;
  }, {} as Record<ReceiptStage, string[]>);
}

function normalizeKanban(items: KanbanItem[]): NormalizedKanban {
  return items.reduce<NormalizedKanban>(
    (acc, item) => {
      acc.items[item.key] = item;
      acc.byStage[item.stage].push(item.key);
      return acc;
    },
    {
      items: {},
      byStage: createEmptyStageMap(),
    }
  );
}

async function fetchFromApi<T>(fallback: T, loader: (api: WindowApi) => Promise<T>): Promise<T> {
  if (!window.api) return fallback;
  try {
    const result = await loader(window.api);
    if (result === null || result === undefined) {
      return fallback;
    }
    return result;
  } catch (error) {
    console.warn('[dataService] Falling back to mock data after IPC failure', error);
    return fallback;
  }
}

export async function fetchCompanies(): Promise<NormalizedEntities<Company>> {
  const raw = await fetchFromApi(fallbackCompanies, (api) => api.companies.list());
  const companies = raw.map(adaptCompany);
  return normalizeEntities(companies);
}

export async function fetchPartners(): Promise<NormalizedEntities<Partner>> {
  const raw = await fetchFromApi(fallbackPartners, (api) => api.partners.list());
  const partners = raw.map(adaptPartner);
  return normalizeEntities(partners);
}

export async function fetchKanban(): Promise<NormalizedKanban> {
  const raw = await fetchFromApi(fallbackKanban, (api) => api.kanban.list());
  const items = raw.map(adaptKanbanItem);
  return normalizeKanban(items);
}

export function createEmptyCompanies(): NormalizedEntities<Company> {
  return { byId: {}, allIds: [] };
}

export function createEmptyPartners(): NormalizedEntities<Partner> {
  return { byId: {}, allIds: [] };
}

export function createEmptyKanban(): NormalizedKanban {
  return {
    items: {},
    byStage: createEmptyStageMap(),
  };
}

export { adaptCompany, adaptPartner, adaptKanbanItem, normalizeEntities, fetchFromApi };
