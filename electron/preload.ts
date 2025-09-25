import { contextBridge, ipcRenderer } from 'electron';
import type { CompanyPayload, KanbanPayload, PartnerPayload } from '../src/types/ipc';

const api = Object.freeze({
  companies: Object.freeze({
    list: () => ipcRenderer.invoke('companies:list'),
    create: (data: CompanyPayload) => ipcRenderer.invoke('companies:create', data),
    update: (data: CompanyPayload) => ipcRenderer.invoke('companies:update', data),
    delete: (id: number) => ipcRenderer.invoke('companies:delete', id)
  }),
  partners: Object.freeze({
    list: () => ipcRenderer.invoke('partners:list'),
    create: (data: PartnerPayload) => ipcRenderer.invoke('partners:create', data),
    update: (data: PartnerPayload) => ipcRenderer.invoke('partners:update', data),
    delete: (id: number) => ipcRenderer.invoke('partners:delete', id)
  }),
  kanban: Object.freeze({
    list: () => ipcRenderer.invoke('kanban:list'),
    upsert: (data: KanbanPayload) => ipcRenderer.invoke('kanban:upsert', data)
  })
} satisfies Window['api']);

contextBridge.exposeInMainWorld('api', api);
