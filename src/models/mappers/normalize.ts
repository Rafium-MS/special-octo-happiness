import { RECEIPT_STAGES, type KanbanItem, type NormalizedEntities, type NormalizedKanban, type ReceiptStage } from '../../types/entities';

export function normalizeEntities<T extends { id: number }>(items: T[]): NormalizedEntities<T> {
  return items.reduce<NormalizedEntities<T>>(
    (acc, item) => {
      acc.byId[item.id] = item;
      acc.allIds.push(item.id);
      return acc;
    },
    { byId: {}, allIds: [] }
  );
}

export function createEmptyEntities<T extends { id: number }>(): NormalizedEntities<T> {
  return { byId: {}, allIds: [] };
}

function createEmptyStageMap(): Record<ReceiptStage, string[]> {
  return RECEIPT_STAGES.reduce<Record<ReceiptStage, string[]>>((acc, stage) => {
    acc[stage] = [];
    return acc;
  }, {} as Record<ReceiptStage, string[]>);
}

export function normalizeKanban(items: KanbanItem[]): NormalizedKanban {
  return items.reduce<NormalizedKanban>(
    (acc, item) => {
      acc.items[item.key] = item;
      acc.byStage[item.stage].push(item.key);
      return acc;
    },
    {
      items: {},
      byStage: createEmptyStageMap(),
    }
  );
}

export function createEmptyKanban(): NormalizedKanban {
  return {
    items: {},
    byStage: createEmptyStageMap(),
  };
}
