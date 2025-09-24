import { contextBridge, ipcRenderer } from 'electron';

type CompanyPayload = {
  id?: number;
  name: string; type: string; stores: number; total_value: number; status: 'ativo'|'inativo';
  contact_name: string; contact_phone: string; contact_email: string;
};

type PartnerPayload = {
  id?: number;
  name: string; region: string; cities_json: string;
  contact_name: string; contact_phone: string; contact_email: string;
  status: 'ativo'|'inativo'; receipts_status: 'enviado'|'pendente';
};

type KanbanPayload = { company: string; stage: 'recebimento'|'relatorio'|'nota_fiscal'; receipts: number; total: number };

contextBridge.exposeInMainWorld('api', {
  companies: {
    list: () => ipcRenderer.invoke('companies:list'),
    create: (data: CompanyPayload) => ipcRenderer.invoke('companies:create', data),
    update: (data: CompanyPayload) => ipcRenderer.invoke('companies:update', data),
    delete: (id: number) => ipcRenderer.invoke('companies:delete', id)
  },
  partners: {
    list: () => ipcRenderer.invoke('partners:list'),
    create: (data: PartnerPayload) => ipcRenderer.invoke('partners:create', data),
    update: (data: PartnerPayload) => ipcRenderer.invoke('partners:update', data),
    delete: (id: number) => ipcRenderer.invoke('partners:delete', id)
  },
  kanban: {
    list: () => ipcRenderer.invoke('kanban:list'),
    upsert: (data: KanbanPayload) => ipcRenderer.invoke('kanban:upsert', data)
  }
});
