import { Mail, MapPin, Phone, Plus } from 'lucide-react';
import BadgeStatus from '../../components/common/BadgeStatus';
import { formatEmail, formatPhone } from '../../utils/formatters';
import { ErrorState, InlineSpinner, SkeletonLine } from '../common/ViewPrimitives';
import type { PartnersViewModel } from '../../controllers/waterDistributionController';

const PartnersView = ({ partners }: { partners: PartnersViewModel }) => {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Parceiros Distribuidores</h2>
        <button
          onClick={partners.onOpenForm}
          className="flex items-center space-x-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          <Plus size={20} />
          <span>Novo Parceiro</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {partners.error ? (
          <div className="md:col-span-2 lg:col-span-3">
            <ErrorState message={partners.error} />
          </div>
        ) : partners.showSkeleton ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={`partner-card-skeleton-${index}`} className="rounded-lg border bg-white p-6">
              <div className="space-y-4">
                <SkeletonLine width="w-48" />
                <div className="space-y-2 text-sm">
                  <SkeletonLine width="w-32" />
                  <SkeletonLine width="w-40" />
                  <SkeletonLine width="w-36" />
                </div>
                <div className="space-y-2">
                  <SkeletonLine width="w-40" />
                  <SkeletonLine width="w-32" />
                </div>
                <SkeletonLine width="w-28" />
              </div>
            </div>
          ))
        ) : (
          partners.items.map((partner) => (
            <div key={partner.id} className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{partner.name}</h3>
                <BadgeStatus
                  label={
                    partner.receiptsStatus === 'enviado' ? 'Comprovante enviado' : 'Comprovante pendente'
                  }
                  tone={partner.receiptsStatus === 'enviado' ? 'success' : 'warning'}
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="mr-2" size={16} />
                  <span>{partner.region}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="mr-2" size={16} />
                  <span>{formatPhone(partner.contact.phone)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="mr-2" size={16} />
                  <span>{formatEmail(partner.contact.email)}</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Cidades de atuação:</p>
                <div className="flex flex-wrap gap-1">
                  {partner.cities.map((city) => (
                    <span key={city} className="rounded bg-gray-100 px-2 py-1 text-xs">
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <BadgeStatus
                    label={`Comprovantes: ${partner.receiptsStatus === 'enviado' ? 'Enviados' : 'Pendentes'}`}
                    tone={partner.receiptsStatus === 'enviado' ? 'success' : 'warning'}
                  />
                  <button
                    onClick={() => partners.onViewDetails(partner)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    aria-label={`Ver detalhes do parceiro ${partner.name}`}
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {partners.isFetching && partners.items.length > 0 && !partners.error && (
        <div className="mt-6">
          <InlineSpinner label="Sincronizando dados dos parceiros..." />
        </div>
      )}
    </div>
  );
};

export default PartnersView;
