export type RawCompany = {
  id: number;
  name: string;
  type: string | null;
  stores: number | null;
  total_value: number | null;
  status: 'ativo' | 'inativo' | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
};

export type RawPartner = {
  id: number;
  name: string;
  region: string | null;
  cities_json: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: 'ativo' | 'inativo' | null;
  receipts_status: 'enviado' | 'pendente' | null;
};

export type RawKanbanItem = {
  company: string;
  stage: 'recebimento' | 'relatorio' | 'nota_fiscal';
  receipts: number;
  total: number;
};

export type WindowApi = {
  companies: {
    list: () => Promise<RawCompany[]>;
    create: (data: unknown) => Promise<unknown>;
    update: (data: unknown) => Promise<unknown>;
    delete: (id: number) => Promise<unknown>;
  };
  partners: {
    list: () => Promise<RawPartner[]>;
    create: (data: unknown) => Promise<unknown>;
    update: (data: unknown) => Promise<unknown>;
    delete: (id: number) => Promise<unknown>;
  };
  kanban: {
    list: () => Promise<RawKanbanItem[]>;
    upsert: (data: unknown) => Promise<unknown>;
  };
};

declare global {
  interface Window {
    api?: WindowApi;
  }
}

export {};
