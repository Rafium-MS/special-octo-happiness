import StatCard from '../../components/dashboard/StatCard';
import PartnerCard from '../../components/common/PartnerCard';
import { ErrorState, InlineSpinner, SkeletonLine } from '../common/ViewPrimitives';
import { formatCurrency } from '../../utils/formatters';
import type { DashboardViewModel } from '../../controllers/waterDistributionController';

const DashboardView = ({ dashboard }: { dashboard: DashboardViewModel }) => {
  const { statCards, showStatsSkeleton, combinedError, partners, companies } = dashboard;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {showStatsSkeleton
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={`stat-skeleton-${index}`} className="rounded-lg border bg-white p-4">
                <SkeletonLine width="w-32" />
                <SkeletonLine className="mt-4" width="w-20" height="h-8" />
              </div>
            ))
          : statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {combinedError && <ErrorState message={combinedError} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Status dos Parceiros</h3>
            {partners.isFetching && partners.items.length > 0 && (
              <InlineSpinner label="Atualizando parceiros..." />
            )}
          </div>

          {partners.error ? (
            <ErrorState message={partners.error} />
          ) : partners.showSkeleton ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`partner-skeleton-${index}`} className="rounded bg-gray-100 p-3">
                  <SkeletonLine width="w-48" />
                  <SkeletonLine className="mt-2" width="w-32" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {partners.items.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Empresas por Faturamento</h3>
            {companies.isFetching && companies.byRevenue.length > 0 && (
              <InlineSpinner label="Atualizando empresas..." />
            )}
          </div>

          {companies.error ? (
            <ErrorState message={companies.error} />
          ) : companies.showSkeleton ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`company-revenue-skeleton-${index}`}
                  className="flex items-center justify-between rounded bg-gray-50 p-3"
                >
                  <div className="space-y-2">
                    <SkeletonLine width="w-48" />
                    <SkeletonLine width="w-24" />
                  </div>
                  <SkeletonLine width="w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {companies.byRevenue.map((company) => (
                <div key={company.id} className="flex items-center justify-between rounded bg-gray-50 p-3">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-gray-600">{company.stores} lojas</p>
                  </div>
                  <p className="font-semibold text-green-600">{formatCurrency(company.totalValue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
