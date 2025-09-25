export const STATUSES = ['ativo', 'inativo'] as const;
export type Status = (typeof STATUSES)[number];

export const RECEIPT_STAGES = ['recebimento', 'relatorio', 'nota_fiscal'] as const;
export type ReceiptStage = (typeof RECEIPT_STAGES)[number];

export const RECEIPT_STATUSES = ['enviado', 'pendente'] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export type Contact = {
  name: string;
  phone: string;
  email: string;
};

export type Company = {
  id: number;
  name: string;
  type: string;
  stores: number;
  totalValue: number;
  status: Status;
  contact: Contact;
};

export type Partner = {
  id: number;
  name: string;
  region: string;
  cities: string[];
  contact: Contact;
  status: Status;
  receiptsStatus: ReceiptStatus;
};

export type KanbanItem = {
  key: string;
  company: string;
  stage: ReceiptStage;
  receipts: number;
  total: number;
};

export type NormalizedEntities<T extends { id: number }> = {
  byId: Record<number, T>;
  allIds: number[];
};

export type NormalizedKanban = {
  items: Record<string, KanbanItem>;
  byStage: Record<ReceiptStage, string[]>;
};
