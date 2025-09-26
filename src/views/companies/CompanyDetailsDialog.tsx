import OverlayDialog from '../../components/ui/OverlayDialog';
import { formatCurrency, formatEmail, formatPhone } from '../../utils/formatters';
import type { DialogsViewModel } from '../../controllers/waterDistributionController';

const stateColorClasses = [
  'text-blue-600',
  'text-green-600',
  'text-purple-600',
  'text-orange-600',
  'text-teal-600',
  'text-rose-600'
];

type CompanyDialogProps = DialogsViewModel['company'];

const CompanyDetailsDialog = ({ selected, titleId, titleRef, onClose }: CompanyDialogProps) => {
  if (!selected) return null;

  const storeEntries = selected.storesByState
    ? Object.entries(selected.storesByState).filter(([, value]) => value > 0)
    : [];
  const hasStoreData = storeEntries.length > 0;

  return (
    <OverlayDialog
      isOpen={Boolean(selected)}
      onClose={onClose}
      titleId={titleId}
      initialFocusRef={titleRef}
    >
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <h2 id={titleId} ref={titleRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
            {selected.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Fechar detalhes da empresa"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-semibold">Informações da Empresa</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Tipo:</span> {selected.type}
              </p>
              <p>
                <span className="font-medium">Total de Lojas:</span> {selected.stores}
              </p>
              <p>
                <span className="font-medium">Valor Total:</span> {formatCurrency(selected.totalValue)}
              </p>
              <p>
                <span className="font-medium">Status:</span> {selected.status}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold">Contato Responsável</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Nome:</span> {selected.contact.name}
              </p>
              <p>
                <span className="font-medium">Telefone:</span> {formatPhone(selected.contact.phone)}
              </p>
              <p>
                <span className="font-medium">Email:</span> {formatEmail(selected.contact.email)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">Lojas por Estado</h3>
          {hasStoreData ? (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                {storeEntries.map(([state, count], index) => {
                  const colorClass = stateColorClasses[index % stateColorClasses.length];
                  return (
                    <div key={state} className="text-center">
                      <p className={`text-lg font-medium ${colorClass}`}>{count}</p>
                      <p className="text-gray-600">{state}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">Dados indisponíveis.</p>
          )}
        </div>
      </div>
    </OverlayDialog>
  );
};

export default CompanyDetailsDialog;
