import OverlayDialog from '../../components/ui/OverlayDialog';
import { RECEIPT_STAGE_METADATA } from '../../constants/receiptStageMetadata';
import type { DialogsViewModel } from '../../controllers/waterDistributionController';

const historyListClasses = 'divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white';

const historyItemClasses = 'flex flex-col gap-1 p-4 text-sm text-gray-700';

type KanbanHistoryDialogProps = DialogsViewModel['kanbanHistory'];

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Data desconhecida';
  }
  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
};

const KanbanHistoryDialog = ({ isOpen, item, titleId, onClose, entries }: KanbanHistoryDialogProps) => {
  if (!item) {
    return null;
  }

  const stageMetadata = RECEIPT_STAGE_METADATA[item.stage];
  const hasEntries = entries.length > 0;

  return (
    <OverlayDialog isOpen={isOpen} onClose={onClose} titleId={titleId} size="lg">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-xl font-semibold text-gray-900">
            Histórico de {item.company}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Fechar histórico"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Acompanhe as alterações realizadas para o estágio "{stageMetadata.title}".
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="rounded-lg bg-gray-50 p-4 text-sm">
          <p className="font-medium text-gray-700">Resumo atual</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-gray-500">Estágio</p>
              <p className="font-medium text-gray-900">{stageMetadata.title}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Comprovantes processados</p>
              <p className="font-medium text-gray-900">{item.receipts}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Total de comprovantes</p>
              <p className="font-medium text-gray-900">{item.total}</p>
            </div>
          </div>
        </div>

        {hasEntries ? (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Alterações registradas</h3>
            <ul className={historyListClasses}>
              {entries.map((entry, index) => (
                <li key={`${entry.timestamp}-${index}`} className={historyItemClasses}>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatTimestamp(entry.timestamp)}</span>
                    <span>{RECEIPT_STAGE_METADATA[entry.stage].title}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span>
                      <span className="font-medium text-gray-600">Comprovantes:</span> {entry.receipts}
                    </span>
                    <span>
                      <span className="font-medium text-gray-600">Total:</span> {entry.total}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            Nenhuma alteração registrada até o momento.
          </p>
        )}
      </div>
    </OverlayDialog>
  );
};

export default KanbanHistoryDialog;
