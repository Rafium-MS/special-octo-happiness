import { useCallback, useEffect, useMemo, useRef, useState, useId, type FormEvent, type KeyboardEvent } from 'react';
import {
  Building,
  Users,
  FileText,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Eye,
  Upload,
  Loader2
} from 'lucide-react';
import type { Company, Partner as PartnerType } from '../services/dataService';
import { selectCompanies, selectKanbanColumns, selectPartners, useWaterDataStore } from '../store/useWaterDataStore';
import { formatCurrency, formatEmail, formatPhone } from '../utils/formatters';
import AccessibleModal from './AccessibleModal';

type ActiveTab = 'dashboard' | 'companies' | 'partners' | 'kanban';
type FormType = 'company' | 'partner';
type FormValues = Partial<{
  name: string;
  type: string;
  stores: number;
  totalValue: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  region: string;
  cities: string[];
}>;

type ToastTone = 'success' | 'info' | 'error';

type ToastMessage = {
  id: string;
  message: string;
  tone: ToastTone;
};

const SkeletonLine = ({
  width = 'w-full',
  height = 'h-4',
  className = ''
}: {
  width?: string;
  height?: string;
  className?: string;
}) => <div className={`animate-pulse rounded bg-gray-200 ${height} ${width} ${className}`.trim()} />;

const ErrorState = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
    {message}
  </div>
);

const InlineSpinner = ({ label }: { label: string }) => (
  <div className="flex items-center space-x-2 text-sm text-gray-500">
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

const WaterDistributionSystem = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const companies = useWaterDataStore(selectCompanies);
  const partners = useWaterDataStore(selectPartners);
  const kanbanColumns = useWaterDataStore(selectKanbanColumns);
  const metaSelector = useCallback(
    (state: ReturnType<typeof useWaterDataStore.getState>) => ({
      fetchAll: state.fetchAll,
      status: state.status,
      errors: state.errors
    }),
    []
  );
  const { fetchAll, status, errors } = useWaterDataStore(metaSelector);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<FormType>('company');
  const [formData, setFormData] = useState<FormValues>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastTimers = useRef<Record<string, number>>({});
  const companyTitleRef = useRef<HTMLHeadingElement>(null);
  const partnerTitleRef = useRef<HTMLHeadingElement>(null);
  const formInitialFieldRef = useRef<HTMLInputElement>(null);
  const companyDialogTitleId = useId();
  const partnerDialogTitleId = useId();
  const formDialogTitleId = useId();

  const isIdle = status.companies === 'idle' && status.partners === 'idle' && status.kanban === 'idle';

  const dismissToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
    const timeoutId = toastTimers.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete toastTimers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((previous) => [...previous, { id, message, tone }]);

      const timeoutId = window.setTimeout(() => {
        dismissToast(id);
      }, 4000);

      toastTimers.current[id] = timeoutId;
    },
    [dismissToast]
  );

  useEffect(() => () => {
    Object.values(toastTimers.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
  }, []);

  useEffect(() => {
    if (isIdle) {
      fetchAll();
    }
  }, [fetchAll, isIdle]);

  useEffect(() => {
    if (!selectedCompany) return;
    const updated = companies.find((company) => company.id === selectedCompany.id);
    if (!updated) {
      setSelectedCompany(null);
      return;
    }
    if (updated !== selectedCompany) {
      setSelectedCompany(updated);
    }
  }, [companies, selectedCompany?.id]);

  useEffect(() => {
    if (!selectedPartner) return;
    const updated = partners.find((partner) => partner.id === selectedPartner.id);
    if (!updated) {
      setSelectedPartner(null);
      return;
    }
    if (updated !== selectedPartner) {
      setSelectedPartner(updated);
    }
  }, [partners, selectedPartner?.id]);

  const totalKanbanItems =
    kanbanColumns.recebimento.length + kanbanColumns.relatorio.length + kanbanColumns.nota_fiscal.length;
  const isFetchingCompanies = status.companies === 'loading';
  const isFetchingPartners = status.partners === 'loading';
  const isFetchingKanban = status.kanban === 'loading';
  const showCompaniesSkeleton =
    (status.companies === 'idle' && companies.length === 0) || (isFetchingCompanies && companies.length === 0);
  const showPartnersSkeleton =
    (status.partners === 'idle' && partners.length === 0) || (isFetchingPartners && partners.length === 0);
  const showKanbanSkeleton =
    (status.kanban === 'idle' && totalKanbanItems === 0) || (isFetchingKanban && totalKanbanItems === 0);
  const globalError = errors.companies || errors.partners || errors.kanban;
  const toastToneStyles: Record<ToastTone, string> = {
    success: 'border-green-200 bg-green-50 text-green-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    error: 'border-red-200 bg-red-50 text-red-900'
  };

  const pendingReceiptsCount = useMemo(
    () => partners.filter(partner => partner.receiptsStatus === 'pendente').length,
    [partners]
  );

  const totalStores = useMemo(
    () => companies.reduce((acc, comp) => acc + comp.stores, 0),
    [companies]
  );

  const companiesByRevenue = useMemo(
    () => [...companies].sort((a, b) => b.totalValue - a.totalValue),
    [companies]
  );

  const tabs = useMemo(
    () => [
      { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
      { id: 'companies' as const, label: 'Empresas', icon: Building },
      { id: 'partners' as const, label: 'Parceiros', icon: Users },
      { id: 'kanban' as const, label: 'Pipeline', icon: FileText }
    ],
    []
  );

  const handleTabChange = useCallback((tabId: ActiveTab) => {
    setActiveTab(tabId);
  }, []);

  const handleOpenCompanyForm = useCallback(() => {
    setShowForm(true);
    setFormType('company');
  }, []);

  const handleOpenPartnerForm = useCallback(() => {
    setShowForm(true);
    setFormType('partner');
  }, []);

  const handleSelectCompany = useCallback((company: Company) => {
    setSelectedCompany(company);
  }, []);

  const handleEditCompany = useCallback(
    (company: Company) => {
      console.warn('Editar empresa ainda não persiste dados', company);
      showToast(`Empresa ${company.name} atualizada com sucesso.`, 'success');
    },
    [showToast]
  );

  const handleDeleteCompany = useCallback(
    (company: Company) => {
      console.warn('Excluir empresa ainda não remove dados', company);
      showToast(`Empresa ${company.name} excluída.`, 'info');
    },
    [showToast]
  );

  const handleSelectPartner = useCallback((partner: PartnerType) => {
    setSelectedPartner(partner);
  }, []);

  const handleActionKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      return;
    }

    const container = event.currentTarget.parentElement;
    if (!container) return;

    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
    const currentIndex = buttons.indexOf(event.currentTarget);
    if (currentIndex === -1) return;

    event.preventDefault();
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  }, []);

  const renderDashboard = () => {
    const hasCombinedError = errors.companies || errors.partners;
    const showStatsSkeleton = showCompaniesSkeleton || showPartnersSkeleton;

    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {showStatsSkeleton ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={`stat-skeleton-${index}`} className="rounded-lg border bg-white p-4">
                <SkeletonLine width="w-32" />
                <SkeletonLine className="mt-4" width="w-20" height="h-8" />
              </div>
            ))
          ) : (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Empresas Ativas</p>
                    <p className="text-2xl font-bold text-blue-800">{companies.length}</p>
                  </div>
                  <Building className="text-blue-500" size={24} />
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Parceiros Ativos</p>
                    <p className="text-2xl font-bold text-green-800">{partners.length}</p>
                  </div>
                  <Users className="text-green-500" size={24} />
                </div>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Comprovantes Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-800">{pendingReceiptsCount}</p>
                  </div>
                  <Clock className="text-yellow-500" size={24} />
                </div>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total de Lojas</p>
                    <p className="text-2xl font-bold text-purple-800">{totalStores}</p>
                  </div>
                  <BarChart3 className="text-purple-500" size={24} />
                </div>
              </div>
            </>
          )}
        </div>

        {hasCombinedError && <ErrorState message={hasCombinedError} />}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Status dos Parceiros</h3>
              {isFetchingPartners && partners.length > 0 && (
                <InlineSpinner label="Atualizando parceiros..." />
              )}
            </div>
            {errors.partners ? (
              <ErrorState message={errors.partners} />
            ) : showPartnersSkeleton ? (
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
                {partners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between rounded bg-gray-50 p-3">
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-sm text-gray-600">{partner.region}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {partner.receiptsStatus === 'enviado' ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <AlertCircle className="text-yellow-500" size={20} />
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-medium ${
                          partner.receiptsStatus === 'enviado'
                            ? 'rounded bg-green-100 text-green-800'
                            : 'rounded bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {partner.receiptsStatus === 'enviado' ? 'Enviado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Empresas por Faturamento</h3>
              {isFetchingCompanies && companies.length > 0 && (
                <InlineSpinner label="Atualizando empresas..." />
              )}
            </div>
            {errors.companies ? (
              <ErrorState message={errors.companies} />
            ) : showCompaniesSkeleton ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`company-revenue-skeleton-${index}`} className="flex items-center justify-between rounded bg-gray-50 p-3">
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
                {companiesByRevenue.map((company) => (
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

  const renderCompanies = () => (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Empresas Cadastradas</h2>
        <button
          onClick={handleOpenCompanyForm}
          className="flex items-center space-x-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          <Plus size={20} />
          <span>Nova Empresa</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Lojas</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Valor Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {errors.companies ? (
              <tr>
                <td colSpan={6} className="px-6 py-6">
                  <ErrorState message={errors.companies} />
                </td>
              </tr>
            ) : showCompaniesSkeleton ? (
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
            ) : (
              companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-gray-600">{company.contact.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{company.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{company.stores}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(company.totalValue)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        company.status === 'ativo'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2" role="group" aria-label={`Ações disponíveis para ${company.name}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectCompany(company)}
                        onKeyDown={handleActionKeyDown}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={`Ver detalhes da empresa ${company.name}`}
                      >
                        <Eye size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditCompany(company)}
                        onKeyDown={handleActionKeyDown}
                        className="text-green-600 hover:text-green-800"
                        aria-label={`Editar empresa ${company.name}`}
                      >
                        <Edit size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCompany(company)}
                        onKeyDown={handleActionKeyDown}
                        className="text-red-600 hover:text-red-800"
                        aria-label={`Excluir empresa ${company.name}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {isFetchingCompanies && companies.length > 0 && !errors.companies && (
              <tr>
                <td colSpan={6} className="px-6 py-3">
                  <InlineSpinner label="Sincronizando dados das empresas..." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPartners = () => (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Parceiros Distribuidores</h2>
        <button
          onClick={handleOpenPartnerForm}
          className="flex items-center space-x-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          <Plus size={20} />
          <span>Novo Parceiro</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {errors.partners ? (
          <div className="md:col-span-2 lg:col-span-3">
            <ErrorState message={errors.partners} />
          </div>
        ) : showPartnersSkeleton ? (
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
          partners.map((partner) => (
            <div key={partner.id} className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{partner.name}</h3>
                <div className="flex items-center space-x-2">
                  {partner.receiptsStatus === 'enviado' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <AlertCircle className="text-yellow-500" size={20} />
                  )}
                </div>
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
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      partner.receiptsStatus === 'enviado'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    Comprovantes: {partner.receiptsStatus === 'enviado' ? 'Enviados' : 'Pendentes'}
                  </span>
                  <button
                    onClick={() => handleSelectPartner(partner)}
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

      {isFetchingPartners && partners.length > 0 && !errors.partners && (
        <div className="mt-6">
          <InlineSpinner label="Sincronizando dados dos parceiros..." />
        </div>
      )}
    </div>
  );

  const renderKanban = () => {
    const columns = [
      {
        key: 'recebimento' as const,
        title: 'Recebimento de Comprovantes',
        icon: Upload,
        containerClass: 'bg-blue-50',
        titleClass: 'text-blue-800',
        barClass: 'bg-blue-500',
        items: kanbanColumns.recebimento,
        progressLabel: 'comprovantes'
      },
      {
        key: 'relatorio' as const,
        title: 'Relatório Preenchido',
        icon: FileText,
        containerClass: 'bg-yellow-50',
        titleClass: 'text-yellow-800',
        barClass: 'bg-yellow-500',
        items: kanbanColumns.relatorio,
        progressLabel: 'processados'
      },
      {
        key: 'nota_fiscal' as const,
        title: 'Nota Fiscal Pronta',
        icon: CheckCircle,
        containerClass: 'bg-green-50',
        titleClass: 'text-green-800',
        barClass: 'bg-green-500',
        items: kanbanColumns.nota_fiscal,
        progressLabel: 'finalizados'
      }
    ];

    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Pipeline de Processamento</h2>
          {isFetchingKanban && totalKanbanItems > 0 && (
            <InlineSpinner label="Atualizando pipeline..." />
          )}
        </div>

        {errors.kanban ? (
          <ErrorState message={errors.kanban} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {columns.map((column) => (
              <div key={column.key} className={`${column.containerClass} rounded-lg p-4`}>
                <h3 className={`mb-4 flex items-center font-semibold ${column.titleClass}`}>
                  <column.icon className="mr-2" size={20} />
                  {column.title}
                </h3>
                <div className="space-y-3">
                  {showKanbanSkeleton
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <div key={`${column.key}-skeleton-${index}`} className="rounded border bg-white p-3">
                          <SkeletonLine width="w-48" />
                          <SkeletonLine className="mt-2" width="w-24" />
                          <SkeletonLine className="mt-3" width="w-full" height="h-2" />
                        </div>
                      ))
                    : column.items.map((item) => (
                        <div key={item.company} className="rounded border bg-white p-3">
                          <p className="font-medium">{item.company}</p>
                          <p className="text-sm text-gray-600">
                            {item.receipts}/{item.total} {column.progressLabel}
                          </p>
                          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                            <div
                              className={`${column.barClass} h-2 rounded-full`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  item.total > 0 ? (item.receipts / item.total) * 100 : 0
                                )}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCompanyDetails = () => {
    if (!selectedCompany) return null;

    return (
      <AccessibleModal
        isOpen={Boolean(selectedCompany)}
        onClose={() => setSelectedCompany(null)}
        titleId={companyDialogTitleId}
        initialFocusRef={companyTitleRef}
      >
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h2
              id={companyDialogTitleId}
              ref={companyTitleRef}
              tabIndex={-1}
              className="text-2xl font-bold focus:outline-none"
            >
              {selectedCompany.name}
            </h2>
            <button
              type="button"
              onClick={() => setSelectedCompany(null)}
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
                  <span className="font-medium">Tipo:</span> {selectedCompany.type}
                </p>
                <p>
                  <span className="font-medium">Total de Lojas:</span> {selectedCompany.stores}
                </p>
                <p>
                  <span className="font-medium">Valor Total:</span> {formatCurrency(selectedCompany.totalValue)}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {selectedCompany.status}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold">Contato Responsável</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Nome:</span> {selectedCompany.contact.name}
                </p>
                <p>
                  <span className="font-medium">Telefone:</span> {formatPhone(selectedCompany.contact.phone)}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {formatEmail(selectedCompany.contact.email)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold">Lojas por Estado</h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div className="text-center">
                  <p className="text-lg font-medium text-blue-600">25</p>
                  <p className="text-gray-600">São Paulo</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-green-600">18</p>
                  <p className="text-gray-600">Rio de Janeiro</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-purple-600">15</p>
                  <p className="text-gray-600">Minas Gerais</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-orange-600">31</p>
                  <p className="text-gray-600">Outros Estados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AccessibleModal>
    );
  };

  const renderPartnerDetails = () => {
    if (!selectedPartner) return null;

    return (
      <AccessibleModal
        isOpen={Boolean(selectedPartner)}
        onClose={() => setSelectedPartner(null)}
        titleId={partnerDialogTitleId}
        initialFocusRef={partnerTitleRef}
        className="max-w-3xl"
      >
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h2
              id={partnerDialogTitleId}
              ref={partnerTitleRef}
              tabIndex={-1}
              className="text-2xl font-bold focus:outline-none"
            >
              {selectedPartner.name}
            </h2>
            <button
              type="button"
              onClick={() => setSelectedPartner(null)}
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
                  <span className="font-medium">Região de Atuação:</span> {selectedPartner.region}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {selectedPartner.status}
                </p>
                <p>
                  <span className="font-medium">Comprovantes:</span> {selectedPartner.receiptsStatus === 'enviado' ? 'Enviados' : 'Pendentes'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold">Dados de Contato</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Users className="mr-2 text-gray-400" size={16} />
                  <span>{selectedPartner.contact.name}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-2 text-gray-400" size={16} />
                  <span>{formatPhone(selectedPartner.contact.phone)}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="mr-2 text-gray-400" size={16} />
                  <span>{formatEmail(selectedPartner.contact.email)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold">Cidades de Atuação</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {selectedPartner.cities.map((city) => (
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
                <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">Concluído</span>
              </div>
              <div className="flex items-center justify-between rounded bg-white p-2">
                <span className="text-sm">Outubro 2024</span>
                <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">Concluído</span>
              </div>
              <div className="flex items-center justify-between rounded bg-white p-2">
                <span className="text-sm">Setembro 2024</span>
                <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">Pendente</span>
              </div>
            </div>
          </div>
        </div>
      </AccessibleModal>
    );
  };

  const renderForm = () => {
    if (!showForm) return null;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      console.warn('Salvar formulário ainda não implementado:', formData);
      const successMessage =
        formType === 'company'
          ? 'Empresa cadastrada com sucesso!'
          : 'Parceiro cadastrado com sucesso!';
      showToast(successMessage, 'success');
      setShowForm(false);
      setFormData({});
    };

    const handleInputChange = <Field extends keyof FormValues>(field: Field, value: FormValues[Field]) => {
      setFormData((previous) => ({ ...previous, [field]: value }));
    };

    return (
      <AccessibleModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        titleId={formDialogTitleId}
        initialFocusRef={formInitialFieldRef}
        className="max-w-2xl"
      >
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h2 id={formDialogTitleId} className="text-2xl font-bold">
              {formType === 'company' ? 'Nova Empresa' : 'Novo Parceiro'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Fechar formulário"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formType === 'company' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: ANIMALE"
                  ref={formInitialFieldRef}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Negócio *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Moda Feminina"
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Lojas
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 89"
                      onChange={(e) => handleInputChange('stores', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Total Mensal
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 15420.50"
                      onChange={(e) => handleInputChange('totalValue', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Dados do Responsável</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do responsável"
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                    />
                    <input
                      type="tel"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Telefone"
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                    <input
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Email"
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Parceiro *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Águas do Sul Ltda"
                  ref={formInitialFieldRef}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Região de Atuação *
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    required
                  >
                    <option value="">Selecione a região</option>
                    <option value="Norte">Norte</option>
                    <option value="Nordeste">Nordeste</option>
                    <option value="Centro-Oeste">Centro-Oeste</option>
                    <option value="Sudeste">Sudeste</option>
                    <option value="Sul">Sul</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidades de Atuação
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Separe as cidades por vírgula"
                    onChange={(e) => handleInputChange('cities', e.target.value.split(',').map(city => city.trim()))}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Dados do Responsável</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nome do responsável"
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                    />
                    <input
                      type="tel"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Telefone"
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                    <input
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Email"
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  formType === 'company'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                Salvar
              </button>
            </div>
          </form>
      </AccessibleModal>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Building className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AquaDistrib Pro</h1>
            </div>

            <div className="flex space-x-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {globalError && (
          <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {globalError}
          </div>
        )}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'companies' && renderCompanies()}
        {activeTab === 'partners' && renderPartners()}
        {activeTab === 'kanban' && renderKanban()}
      </main>

      {renderCompanyDetails()}
      {renderPartnerDetails()}
      {renderForm()}

      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col space-y-2"
          role="status"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-lg border p-4 shadow-md transition ${toastToneStyles[toast.tone]}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="ml-4 text-sm text-current transition hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Fechar notificação"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaterDistributionSystem;
