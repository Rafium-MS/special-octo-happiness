import { ArrowRight, History, Pencil } from 'lucide-react';
import ProgressBar from '../../components/common/ProgressBar';
import { RECEIPT_STAGE_METADATA, RECEIPT_STAGE_ORDER } from '../../constants/receiptStageMetadata';
import type { KanbanViewModel } from '../../controllers/waterDistributionController';
import { ErrorState, InlineSpinner, SkeletonLine } from '../common/ViewPrimitives';

const columnToneStyles = {
  blue: { container: 'bg-blue-50', title: 'text-blue-800' },
  yellow: { container: 'bg-yellow-50', title: 'text-yellow-800' },
  green: { container: 'bg-green-50', title: 'text-green-800' }
} as const;

type KanbanCardActionButtonProps = {
  icon: typeof ArrowRight;
  label: string;
  onClick: () => void;
};

const KanbanCardActionButton = ({ icon: Icon, label, onClick }: KanbanCardActionButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
    aria-label={label}
  >
    <Icon className="h-4 w-4" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </button>
);

const KanbanView = ({ kanban }: { kanban: KanbanViewModel }) => {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pipeline de Processamento</h2>
        {kanban.isFetching && Object.values(kanban.columns).some((items) => items.length > 0) && (
          <InlineSpinner label="Atualizando pipeline..." />
        )}
      </div>

      {kanban.error ? (
        <ErrorState message={kanban.error} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {RECEIPT_STAGE_ORDER.map((stage) => {
            const column = RECEIPT_STAGE_METADATA[stage];
            const Icon = column.icon;

            return (
              <div key={stage} className={`${columnToneStyles[column.tone].container} rounded-lg p-4`}>
                <h3 className={`mb-4 flex items-center font-semibold ${columnToneStyles[column.tone].title}`}>
                  <Icon className="mr-2" size={20} />
                  {column.title}
                </h3>
                <div className="space-y-3">
                  {kanban.showSkeleton
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <div key={`${stage}-skeleton-${index}`} className="rounded border bg-white p-3">
                          <SkeletonLine width="w-48" />
                          <SkeletonLine className="mt-2" width="w-24" />
                          <SkeletonLine className="mt-3" width="w-full" height="h-2" />
                        </div>
                      ))
                    : kanban.columns[stage].map((item) => (
                        <div key={`${stage}-${item.company}`} className="rounded border bg-white p-3">
                          <p className="font-medium">{item.company}</p>
                          <p className="text-sm text-gray-600">
                            {item.receipts}/{item.total} {column.progressLabel}
                          </p>
                          <ProgressBar value={item.receipts} total={item.total} tone={column.tone} />
                          <div className="mt-3 flex items-center gap-2">
                            <KanbanCardActionButton
                              icon={ArrowRight}
                              label={`Mover ${item.company} para o próximo estágio`}
                              onClick={() => kanban.onMoveStage(item)}
                            />
                            <KanbanCardActionButton
                              icon={Pencil}
                              label={`Editar totais de ${item.company}`}
                              onClick={() => kanban.onEditTotals(item)}
                            />
                            <KanbanCardActionButton
                              icon={History}
                              label={`Histórico de alterações de ${item.company}`}
                              onClick={() => kanban.onViewHistory(item)}
                            />
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KanbanView;
