import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type MutableRefObject } from 'react';
import { BarChart3, Building, Clock, Users } from 'lucide-react';
import DashboardView from '../dashboard/DashboardView';
import CompaniesView from '../companies/CompaniesView';
import PartnersView from '../partners/PartnersView';
import KanbanView from '../kanban/KanbanView';
import type {
  CompaniesViewModel,
  DashboardViewModel,
  KanbanViewModel,
  PartnersViewModel
} from '../../controllers/waterDistributionController';
import type { Company, Partner } from '../../types/entities';
import type { KanbanItem } from '../../types/entities';

const sampleCompany: Company = {
  id: 1,
  name: 'Companhia Azul',
  type: 'Moda',
  stores: 5,
  storesByState: null,
  totalValue: 1500,
  status: 'ativo',
  contact: {
    name: 'Alice',
    phone: '(11) 90000-0001',
    email: 'alice@example.com'
  }
};

const samplePartner: Partner = {
  id: 1,
  name: 'Distribuidora Norte',
  region: 'Norte',
  cities: ['Manaus'],
  contact: {
    name: 'Bruno',
    phone: '(11) 98888-0001',
    email: 'bruno@example.com'
  },
  status: 'ativo',
  receiptsStatus: 'pendente'
};

const kanbanItem: KanbanItem = {
  company: 'Companhia Azul',
  stage: 'recebimento',
  receipts: 2,
  total: 4
};

describe('DashboardView', () => {
  it('renders stat cards and partner information', () => {
    const dashboard: DashboardViewModel = {
      statCards: [
        { label: 'Empresas Ativas', value: 10, icon: Building, tone: 'blue' },
        { label: 'Parceiros Ativos', value: 5, icon: Users, tone: 'green' },
        { label: 'Comprovantes Pendentes', value: 2, icon: Clock, tone: 'yellow' },
        { label: 'Total de Lojas', value: 30, icon: BarChart3, tone: 'purple' }
      ],
      showStatsSkeleton: false,
      combinedError: null,
      partners: {
        items: [samplePartner],
        showSkeleton: false,
        isFetching: false,
        error: null
      },
      companies: {
        byRevenue: [sampleCompany],
        showSkeleton: false,
        isFetching: false,
        error: null
      }
    };

    render(<DashboardView dashboard={dashboard} />);

    expect(screen.getByText('Empresas Ativas')).toBeInTheDocument();
    expect(screen.getByText('Distribuidora Norte')).toBeInTheDocument();
    expect(screen.getByText('Companhia Azul')).toBeInTheDocument();
  });
});

describe('CompaniesView', () => {
  it('invokes callbacks when interacting with the table', () => {
    const onOpenForm = vi.fn();
    const onSort = vi.fn();

    const sentinelRef = { current: null } as MutableRefObject<HTMLDivElement | null>;

    const viewModel: CompaniesViewModel = {
      filters: {
        searchTerm: '',
        status: 'all',
        type: 'all',
        storeRange: 'all',
        typeOptions: ['Moda'],
        onSearchChange: vi.fn(),
        onStatusChange: vi.fn(),
        onTypeChange: vi.fn(),
        onStoreRangeChange: vi.fn()
      },
      sorting: {
        config: { key: 'name', direction: 'asc' },
        onSort,
        getIndicator: () => '▲',
        getAriaSort: () => 'ascending'
      },
      pagination: {
        visibleCompanies: [sampleCompany],
        totalFilteredCompanies: 1,
        hasMoreCompanies: false,
        sentinelRef
      },
      states: {
        showSkeleton: false,
        isFetching: false,
        error: null
      },
      actions: {
        onView: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onActionKeyDown: vi.fn(),
        onOpenForm
      }
    };

    render(<CompaniesView companies={viewModel} />);

    fireEvent.click(screen.getByRole('button', { name: /Nova Empresa/i }));
    expect(onOpenForm).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Empresa' }));
    expect(onSort).toHaveBeenCalledWith('name');
    expect(screen.getByText('Companhia Azul')).toBeInTheDocument();
  });
});

describe('PartnersView', () => {
  it('renders partner cards and triggers details callback', () => {
    const onOpenForm = vi.fn();
    const onViewDetails = vi.fn();

    const viewModel: PartnersViewModel = {
      items: [samplePartner],
      showSkeleton: false,
      isFetching: false,
      error: null,
      onOpenForm,
      onViewDetails
    };

    render(<PartnersView partners={viewModel} />);

    fireEvent.click(screen.getByRole('button', { name: /Ver Detalhes/i }));
    expect(onViewDetails).toHaveBeenCalledWith(samplePartner);
    expect(screen.getByText('Distribuidora Norte')).toBeInTheDocument();
  });
});

describe('KanbanView', () => {
  it('calls action handlers when interacting with kanban cards', () => {
    const onMoveStage = vi.fn();
    const onEditTotals = vi.fn();
    const onViewHistory = vi.fn();

    const viewModel: KanbanViewModel = {
      showSkeleton: false,
      isFetching: false,
      error: null,
      columns: {
        recebimento: [kanbanItem],
        relatorio: [],
        nota_fiscal: []
      },
      onMoveStage,
      onEditTotals,
      onViewHistory
    };

    render(<KanbanView kanban={viewModel} />);

    fireEvent.click(screen.getByRole('button', { name: /Mover Companhia Azul/i }));
    expect(onMoveStage).toHaveBeenCalledWith(kanbanItem);

    fireEvent.click(screen.getByRole('button', { name: /Editar totais de Companhia Azul/i }));
    expect(onEditTotals).toHaveBeenCalledWith(kanbanItem);

    fireEvent.click(screen.getByRole('button', { name: /Histórico de alterações de Companhia Azul/i }));
    expect(onViewHistory).toHaveBeenCalledWith(kanbanItem);
  });
});
