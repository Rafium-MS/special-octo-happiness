import { Mail, MapPin, Phone, Users } from 'lucide-react';
import OverlayDialog from '../../components/ui/OverlayDialog';
import BadgeStatus from '../../components/common/BadgeStatus';
import { formatEmail, formatPhone } from '../../utils/formatters';
import type { DialogsViewModel } from '../../controllers/waterDistributionController';

const PartnerDetailsDialog = ({ selected, titleId, titleRef, onClose }: DialogsViewModel['partner']) => {
  if (!selected) return null;

  return (
    <OverlayDialog
      isOpen={Boolean(selected)}
      onClose={onClose}
      titleId={titleId}
      initialFocusRef={titleRef}
      className="max-w-3xl"
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
            aria-label="Fechar detalhes do parceiro"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-semibold">Informações do Parceiro</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Região de Atuação:</span> {selected.region}
              </p>
              <p>
                <span className="font-medium">Status:</span> {selected.status}
              </p>
              <p>
                <span className="font-medium">Comprovantes:</span>{' '}
                {selected.receiptsStatus === 'enviado' ? 'Enviados' : 'Pendentes'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold">Dados de Contato</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Users className="mr-2 text-gray-400" size={16} />
                <span>{selected.contact.name}</span>
              </div>
              <div className="flex items-center">
                <Phone className="mr-2 text-gray-400" size={16} />
                <span>{formatPhone(selected.contact.phone)}</span>
              </div>
              <div className="flex items-center">
                <Mail className="mr-2 text-gray-400" size={16} />
                <span>{formatEmail(selected.contact.email)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold">Cidades de Atuação</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {selected.cities.map((city) => (
              <div key={city} className="rounded-lg bg-blue-50 p-3 text-center">
                <MapPin className="mx-auto mb-1 text-blue-500" size={20} />
                <p className="font-medium text-blue-800">{city}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="mb-3 text-lg font-semibold">Histórico de Entregas</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded bg-white p-2">
              <span className="text-sm">Novembro 2024</span>
              <BadgeStatus label="Concluído" tone="success" pill={false} />
            </div>
            <div className="flex items-center justify-between rounded bg-white p-2">
              <span className="text-sm">Outubro 2024</span>
              <BadgeStatus label="Em andamento" tone="warning" pill={false} />
            </div>
            <div className="flex items-center justify-between rounded bg-white p-2">
              <span className="text-sm">Setembro 2024</span>
              <BadgeStatus label="Pendente" tone="info" pill={false} />
            </div>
          </div>
        </div>
      </div>
    </OverlayDialog>
  );
};

export default PartnerDetailsDialog;
