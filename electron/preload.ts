import { contextBridge, ipcRenderer } from 'electron';
import type { CompanyPayload, KanbanPayload, PartnerPayload } from '../src/types/ipc';

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
