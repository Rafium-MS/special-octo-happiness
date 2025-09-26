import type { RawKanbanItem } from '../../types/ipc';

const kanban: RawKanbanItem[] = [
  { company: 'ANIMALE', stage: 'recebimento', receipts: 45, total: 89 },
  { company: 'AREZZO', stage: 'relatorio', receipts: 14, total: 14 },
  { company: 'BAGAGGIO', stage: 'nota_fiscal', receipts: 29, total: 29 },
  { company: 'CLARO', stage: 'recebimento', receipts: 123, total: 156 },
  { company: 'DAISO', stage: 'relatorio', receipts: 67, total: 67 }
];

export function getMockKanban(): RawKanbanItem[] {
  return kanban.map((item) => ({ ...item }));
}

export { kanban as mockKanban };
