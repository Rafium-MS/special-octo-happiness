import { RawCompany, RawKanbanItem, RawPartner } from '../types/ipc';

type Contact = {
  name: string;
  phone: string;
  email: string;
};

export type CompanyStatus = 'ativo' | 'inativo';
export type PartnerReceiptsStatus = 'enviado' | 'pendente';
export type KanbanStage = 'recebimento' | 'relatorio' | 'nota_fiscal';

export type Company = {
  id: number;
  name: string;
  type: string;
  stores: number;
  totalValue: number;
  status: CompanyStatus;
  contact: Contact;
};

export type Partner = {
  id: number;
  name: string;
  region: string;
  cities: string[];
  contact: Contact;
  status: CompanyStatus;
  receiptsStatus: PartnerReceiptsStatus;
};

export type KanbanItem = {
  key: string;
  company: string;
  stage: KanbanStage;
  receipts: number;
  total: number;
};

export type NormalizedEntities<T extends { id: number }> = {
  byId: Record<number, T>;
  allIds: number[];
};

export type NormalizedKanban = {
  items: Record<string, KanbanItem>;
  byStage: Record<KanbanStage, string[]>;
};

const emptyContact: Contact = { name: '', phone: '', email: '' };

const fallbackCompanies: RawCompany[] = [
  {
    id: 1,
    name: 'ANIMALE',
    type: 'Moda Feminina',
    stores: 89,
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

function adaptCompany(raw: RawCompany): Company {
  return {
    id: raw.id,
    name: raw.name,
    type: ensureValue(raw.type, ''),
    stores: ensureValue(raw.stores, 0),
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

function normalizeKanban(items: KanbanItem[]): NormalizedKanban {
  return items.reduce<NormalizedKanban>(
    (acc, item) => {
      acc.items[item.key] = item;
      acc.byStage[item.stage].push(item.key);
      return acc;
    },
    {
      items: {},
      byStage: {
        recebimento: [],
        relatorio: [],
        nota_fiscal: []
      }
    }
  );
}

async function fetchFromApi<T>(fallback: T, loader: () => Promise<T>): Promise<T> {
  if (!window.api) return fallback;
  try {
    const result = await loader();
    if (!result || (Array.isArray(result) && result.length === 0)) {
      return fallback;
    }
    return result;
  } catch (error) {
    console.warn('[dataService] Falling back to mock data after IPC failure', error);
    return fallback;
  }
}

export async function fetchCompanies(): Promise<NormalizedEntities<Company>> {
  const raw = await fetchFromApi(fallbackCompanies, () => window.api!.companies.list());
  const companies = raw.map(adaptCompany);
  return normalizeEntities(companies);
}

export async function fetchPartners(): Promise<NormalizedEntities<Partner>> {
  const raw = await fetchFromApi(fallbackPartners, () => window.api!.partners.list());
  const partners = raw.map(adaptPartner);
  return normalizeEntities(partners);
}

export async function fetchKanban(): Promise<NormalizedKanban> {
  const raw = await fetchFromApi(fallbackKanban, () => window.api!.kanban.list());
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
    byStage: {
      recebimento: [],
      relatorio: [],
      nota_fiscal: []
    }
  };
}
