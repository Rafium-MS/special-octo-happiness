import { getMockKanban } from '../data/fixtures';
import { adaptKanbanItem, createEmptyKanban, normalizeKanban } from '../models/mappers';
import type { KanbanItem, NormalizedKanban } from '../types/entities';
import type { RawKanbanItem, WindowApi } from '../types/ipc';
import { fetchWithFallback } from './utils';

type Dependencies = {
  api?: WindowApi | null;
  fallback?: RawKanbanItem[];
};

export type KanbanRepository = {
  list: () => Promise<NormalizedKanban>;
  createEmpty: () => NormalizedKanban;
};

export function createKanbanRepository({ api = window.api, fallback = getMockKanban() }: Dependencies = {}): KanbanRepository {
  return {
    async list() {
      const raw = await fetchWithFallback(fallback, (resolvedApi) => resolvedApi.kanban.list(), { api });
      const items: KanbanItem[] = raw.map(adaptKanbanItem);
      return normalizeKanban(items);
    },
    createEmpty() {
      return createEmptyKanban();
    },
  };
}

export const kanbanRepository = createKanbanRepository();
