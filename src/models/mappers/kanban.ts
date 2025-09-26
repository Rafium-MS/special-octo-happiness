import type { KanbanItem } from '../../types/entities';
import type { RawKanbanItem } from '../../types/ipc';

export function adaptKanbanItem(raw: RawKanbanItem): KanbanItem {
  const key = `${raw.company}:${raw.stage}`;
  return {
    key,
    company: raw.company,
    stage: raw.stage,
    receipts: raw.receipts,
    total: raw.total
  };
}
