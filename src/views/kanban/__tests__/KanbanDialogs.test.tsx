import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import KanbanEditTotalsDialog from '../KanbanEditTotalsDialog';
import KanbanHistoryDialog from '../KanbanHistoryDialog';
import type { DialogsViewModel } from '../../../controllers/waterDistributionController';
import type { KanbanHistoryEntry, KanbanItem } from '../../../types/entities';

describe('KanbanEditTotalsDialog', () => {
  const item: KanbanItem = {
    key: 'Empresa Norte:recebimento',
    company: 'Empresa Norte',
    stage: 'recebimento',
    receipts: 5,
    total: 10
  };

  const baseProps: DialogsViewModel['kanbanTotals'] = {
    isOpen: true,
    item,
    titleId: 'editar-totais',
    onClose: vi.fn(),
    onConfirm: vi.fn()
  };

  it('preenche o formulário com os valores atuais e confirma alterações', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<KanbanEditTotalsDialog {...baseProps} onConfirm={onConfirm} />);

    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Comprovantes processados/i), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText(/Total de comprovantes/i), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar alterações/i }));

    expect(onConfirm).toHaveBeenCalledWith({ receipts: 7, total: 12 });
  });

  it('exibe mensagem de erro quando os comprovantes excedem o total', () => {
    render(<KanbanEditTotalsDialog {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/Comprovantes processados/i), { target: { value: '11' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar alterações/i }));

    expect(
      screen.getByText('Os comprovantes processados não podem exceder o total.')
    ).toBeInTheDocument();
  });
});

describe('KanbanHistoryDialog', () => {
  const item: KanbanItem = {
    key: 'Empresa Sul:relatorio',
    company: 'Empresa Sul',
    stage: 'relatorio',
    receipts: 3,
    total: 5
  };

  const entries: KanbanHistoryEntry[] = [
    {
      timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
      stage: 'relatorio',
      receipts: 2,
      total: 5
    },
    {
      timestamp: new Date('2024-02-01T10:00:00Z').toISOString(),
      stage: 'relatorio',
      receipts: 3,
      total: 5
    }
  ];

  const baseProps: DialogsViewModel['kanbanHistory'] = {
    isOpen: true,
    item,
    titleId: 'historico-kanban',
    onClose: vi.fn(),
    entries: [...entries].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
  };

  it('renderiza o resumo atual e as entradas do histórico em ordem', () => {
    render(<KanbanHistoryDialog {...baseProps} />);

    expect(screen.getByText(/Resumo atual/i)).toBeInTheDocument();
    const renderedEntries = screen
      .getAllByText(/Comprovantes:/i)
      .map((label) => label.parentElement as HTMLElement);
    expect(renderedEntries).toHaveLength(2);
    expect(renderedEntries[0]).toHaveTextContent('Comprovantes: 3');
    expect(renderedEntries[1]).toHaveTextContent('Comprovantes: 2');
  });

  it('mostra mensagem para histórico vazio', () => {
    render(<KanbanHistoryDialog {...baseProps} entries={[]} />);

    expect(screen.getByText(/Nenhuma alteração registrada/i)).toBeInTheDocument();
  });
});
