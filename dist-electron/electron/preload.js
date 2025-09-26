"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = Object.freeze({
    companies: Object.freeze({
        list: () => electron_1.ipcRenderer.invoke('companies:list'),
        create: (data) => electron_1.ipcRenderer.invoke('companies:create', data),
        update: (data) => electron_1.ipcRenderer.invoke('companies:update', data),
        delete: (id) => electron_1.ipcRenderer.invoke('companies:delete', id)
    }),
    partners: Object.freeze({
        list: () => electron_1.ipcRenderer.invoke('partners:list'),
        create: (data) => electron_1.ipcRenderer.invoke('partners:create', data),
        update: (data) => electron_1.ipcRenderer.invoke('partners:update', data),
        delete: (id) => electron_1.ipcRenderer.invoke('partners:delete', id)
    }),
    kanban: Object.freeze({
        list: () => electron_1.ipcRenderer.invoke('kanban:list'),
        upsert: (data) => electron_1.ipcRenderer.invoke('kanban:upsert', data)
    })
});
electron_1.contextBridge.exposeInMainWorld('api', api);
