import type { ReceiptStage, ReceiptStatus, Status } from './entities';

export type RawCompany = {
  id: number;
  name: string;
  type: string | null;
  stores: number | null;
  stores_by_state_json: string | null;
  total_value: number | null;
  status: Status | null;
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
  status: Status | null;
  receipts_status: ReceiptStatus | null;
};

export type RawKanbanItem = {
  company: string;
  stage: ReceiptStage;
  receipts: number;
  total: number;
};

export type CompanyPayload = {
  id?: number;
  name: string;
  type: string;
  stores: number;
  total_value: number;
  status: Status;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
};

export type PartnerPayload = {
  id?: number;
  name: string;
  region: string;
  cities_json: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  status: Status;
  receipts_status: ReceiptStatus;
};

export type KanbanPayload = {
  company: string;
  stage: ReceiptStage;
  receipts: number;
  total: number;
};

export type CreateResponse = { id: number };
export type SuccessResponse = { ok: true };

export type WindowApi = {
  companies: {
    list: () => Promise<RawCompany[]>;
    create: (data: CompanyPayload) => Promise<CreateResponse>;
    update: (data: CompanyPayload) => Promise<SuccessResponse>;
    delete: (id: number) => Promise<SuccessResponse>;
  };
  partners: {
    list: () => Promise<RawPartner[]>;
    create: (data: PartnerPayload) => Promise<CreateResponse>;
    update: (data: PartnerPayload) => Promise<SuccessResponse>;
    delete: (id: number) => Promise<SuccessResponse>;
  };
  kanban: {
    list: () => Promise<RawKanbanItem[]>;
    upsert: (data: KanbanPayload) => Promise<SuccessResponse>;
  };
};

declare global {
  interface Window {
    api?: WindowApi;
  }
}

export {};
