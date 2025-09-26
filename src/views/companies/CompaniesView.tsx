import { Plus } from 'lucide-react';
import CompanyRow from '../../components/common/CompanyRow';
import type { CompaniesViewModel } from '../../controllers/waterDistributionController';
import { STORE_RANGE_OPTIONS } from '../../controllers/waterDistributionController';
import { STATUSES } from '../../types/entities';
import { ErrorState, InlineSpinner, SkeletonLine } from '../common/ViewPrimitives';

const CompaniesView = ({ companies }: { companies: CompaniesViewModel }) => {
  const { filters, sorting, pagination, states, actions } = companies;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Empresas Cadastradas</h2>
        <button
          onClick={actions.onOpenForm}
          className="flex items-center space-x-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          data-testid="add-company-button"
        >
          <Plus size={20} />
          <span>Nova Empresa</span>
        </button>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="company-search" className="block text-sm font-medium text-gray-700">
            Buscar
          </label>
          <input
            id="company-search"
            type="search"
            value={filters.searchTerm}
            onChange={filters.onSearchChange}
            placeholder="Pesquisar por nome, contato ou tipo"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="company-status-filter" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="company-status-filter"
            value={filters.status}
            onChange={filters.onStatusChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="company-type-filter" className="block text-sm font-medium text-gray-700">
            Tipo de empresa
          </label>
          <select
            id="company-type-filter"
            value={filters.type}
            onChange={filters.onTypeChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            {filters.typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="company-store-filter" className="block text-sm font-medium text-gray-700">
            Faixa de lojas
          </label>
          <select
            id="company-store-filter"
            value={filters.storeRange}
            onChange={filters.onStoreRangeChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {STORE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left" aria-sort={sorting.getAriaSort('name')}>
                <button
                  type="button"
                  onClick={() => sorting.onSort('name')}
                  className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500 focus:outline-none"
                >
                  <span>Empresa</span>
                  <span aria-hidden="true" className="text-[10px] text-gray-400">
                    {sorting.getIndicator('name')}
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
              <th className="px-6 py-3 text-left" aria-sort={sorting.getAriaSort('stores')}>
                <button
                  type="button"
                  onClick={() => sorting.onSort('stores')}
                  className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500 focus:outline-none"
                >
                  <span>Lojas</span>
                  <span aria-hidden="true" className="text-[10px] text-gray-400">
                    {sorting.getIndicator('stores')}
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left" aria-sort={sorting.getAriaSort('totalValue')}>
                <button
                  type="button"
                  onClick={() => sorting.onSort('totalValue')}
                  className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500 focus:outline-none"
                >
                  <span>Valor Total</span>
                  <span aria-hidden="true" className="text-[10px] text-gray-400">
                    {sorting.getIndicator('totalValue')}
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {states.error ? (
              <tr>
                <td colSpan={6} className="px-6 py-6">
                  <ErrorState message={states.error} />
                </td>
              </tr>
            ) : states.showSkeleton ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={`company-skeleton-${index}`} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <SkeletonLine width="w-40" />
                      <SkeletonLine width="w-32" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <SkeletonLine width="w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <SkeletonLine width="w-12" />
                  </td>
                  <td className="px-6 py-4">
                    <SkeletonLine width="w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <SkeletonLine width="w-16" />
                  </td>
                  <td className="px-6 py-4">
                    <SkeletonLine width="w-24" />
                  </td>
                </tr>
              ))
            ) : pagination.visibleCompanies.length > 0 ? (
              pagination.visibleCompanies.map((company) => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  onView={actions.onView}
                  onEdit={actions.onEdit}
                  onDelete={actions.onDelete}
                  onActionKeyDown={actions.onActionKeyDown}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">
                  Nenhuma empresa encontrada com os filtros selecionados.
                </td>
              </tr>
            )}
            {states.isFetching && pagination.visibleCompanies.length > 0 && !states.error && (
              <tr>
                <td colSpan={6} className="px-6 py-3">
                  <InlineSpinner label="Sincronizando dados das empresas..." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!states.error && !states.showSkeleton && (
        <div className="px-1 py-4 text-sm text-gray-600 sm:px-0">
          <p>
            Mostrando {pagination.visibleCompanies.length} de {pagination.totalFilteredCompanies}{' '}
            {pagination.totalFilteredCompanies === 1 ? 'empresa' : 'empresas'}
            {pagination.hasMoreCompanies && (
              <span className="ml-1 text-gray-400">Role para carregar mais resultados.</span>
            )}
          </p>
        </div>
      )}

      <div ref={pagination.sentinelRef} aria-hidden="true" className="h-1 w-full" />
    </div>
  );
};

export default CompaniesView;
