import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type ChangeEvent,
  type KeyboardEvent
} from 'react';
import {
  ArrowRight,
  Building,
  Users,
  FileText,
  BarChart3,
  Clock,
  Plus,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Pencil,
  History
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Company, Partner as PartnerType } from '../services/dataService';
import { STATUSES, type Status } from '../types/entities';
import { selectCompanies, selectKanbanColumns, selectPartners, useWaterDataStore } from '../store/useWaterDataStore';
import { formatCurrency, formatEmail, formatPhone } from '../utils/formatters';
import { useThemePreference } from '../hooks/useThemePreference';
import CompanyForm, { type CompanyFormValues } from './forms/CompanyForm';
import PartnerForm, { type PartnerFormValues } from './forms/PartnerForm';
import OverlayDialog from './ui/OverlayDialog';
import StatCard from './dashboard/StatCard';
import ToolbarTabs from './common/ToolbarTabs';
import PartnerCard from './common/PartnerCard';
import CompanyRow from './common/CompanyRow';
import ProgressBar from './common/ProgressBar';
import BadgeStatus from './common/BadgeStatus';
import ThemeToggle from './common/ThemeToggle';
import { RECEIPT_STAGE_METADATA, RECEIPT_STAGE_ORDER } from '../constants/receiptStageMetadata';
import type { KanbanItem, ReceiptStage } from '../types/entities';

type ActiveTab = 'dashboard' | 'companies' | 'partners' | 'kanban';
type FormType = 'company' | 'partner';
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

const PAGE_SIZE = 10;

type SortKey = 'name' | 'stores' | 'totalValue';
type SortDirection = 'asc' | 'desc';
type SortConfig = { key: SortKey; direction: SortDirection };

type StoreRangeValue = 'all' | '0-10' | '11-50' | '51-100' | '101+';
type StatusFilterValue = 'all' | Status;

const STORE_RANGE_OPTIONS: Array<{
  value: StoreRangeValue;
  label: string;
  matches: (stores: number) => boolean;
}> = [
  { value: 'all', label: 'Todas as faixas', matches: () => true },
  { value: '0-10', label: 'Até 10 lojas', matches: (stores) => stores <= 10 },
  { value: '11-50', label: '11 a 50 lojas', matches: (stores) => stores >= 11 && stores <= 50 },
  { value: '51-100', label: '51 a 100 lojas', matches: (stores) => stores >= 51 && stores <= 100 },
  { value: '101+', label: 'Acima de 100 lojas', matches: (stores) => stores >= 101 }
];

const KanbanCardActionButton = ({
  icon: Icon,
  label,
  onClick
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) => (
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

const WaterDistributionSystem = () => {
  const { preference: themePreference, resolvedTheme, setPreference: setThemePreference } = useThemePreference();
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [storeRange, setStoreRange] = useState<StoreRangeValue>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const toastTimers = useRef<Record<string, number>>({});
  const companyTitleRef = useRef<HTMLHeadingElement>(null);
  const partnerTitleRef = useRef<HTMLHeadingElement>(null);
  const formInitialFieldRef = useRef<HTMLInputElement>(null);
  const companyDialogTitleId = useId();
  const partnerDialogTitleId = useId();
  const formDialogTitleId = useId();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

  const totalKanbanItems = useMemo(
    () => RECEIPT_STAGE_ORDER.reduce((sum, stage) => sum + kanbanColumns[stage].length, 0),
    [kanbanColumns]
  );
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

  const handleSearchTermChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value as StatusFilterValue);
  }, []);

  const handleTypeFilterChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(event.target.value);
  }, []);

  const handleStoreRangeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setStoreRange(event.target.value as StoreRangeValue);
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortConfig((previous) =>
      previous.key === key
        ? { key, direction: previous.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }, []);

  const getSortIndicator = useCallback(
    (key: SortKey) => {
      if (sortConfig.key !== key) {
        return '⇅';
      }
      return sortConfig.direction === 'asc' ? '▲' : '▼';
    },
    [sortConfig]
  );

  const getAriaSort = useCallback(
    (key: SortKey): 'ascending' | 'descending' | 'none' => {
      if (sortConfig.key !== key) {
        return 'none';
      }
      return sortConfig.direction === 'asc' ? 'ascending' : 'descending';
    },
    [sortConfig]
  );

  const companyTypeOptions = useMemo(() => {
    const types = companies.reduce<string[]>((accumulator, company) => {
      if (company.type && !accumulator.includes(company.type)) {
        accumulator.push(company.type);
      }
      return accumulator;
    }, []);

    return types.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [companies]);

  useEffect(() => {
    if (typeFilter === 'all') return;
    if (!companyTypeOptions.includes(typeFilter)) {
      setTypeFilter('all');
    }
  }, [companyTypeOptions, typeFilter]);

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const storeRangeOption =
      STORE_RANGE_OPTIONS.find((option) => option.value === storeRange) ?? STORE_RANGE_OPTIONS[0];

    return companies.filter((company) => {
      if (statusFilter !== 'all' && company.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== 'all' && company.type !== typeFilter) {
        return false;
      }

      if (!storeRangeOption.matches(company.stores)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        company.name,
        company.type,
        company.contact.name,
        company.contact.email,
        company.contact.phone
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [companies, searchTerm, statusFilter, storeRange, typeFilter]);

  const sortedCompanies = useMemo(() => {
    const sorted = [...filteredCompanies];

    const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      if (sortConfig.key === 'name') {
        return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }) * directionMultiplier;
      }

      if (sortConfig.key === 'stores') {
        return (a.stores - b.stores) * directionMultiplier;
      }

      return (a.totalValue - b.totalValue) * directionMultiplier;
    });

    return sorted;
  }, [filteredCompanies, sortConfig]);

  const visibleCompanies = useMemo(
    () => sortedCompanies.slice(0, Math.max(visibleCount, 0)),
    [sortedCompanies, visibleCount]
  );

  const totalFilteredCompanies = filteredCompanies.length;
  const hasMoreCompanies = totalFilteredCompanies > visibleCount;

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMoreCompanies) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setVisibleCount((previous) =>
            Math.min(previous + PAGE_SIZE, totalFilteredCompanies)
          );
        }
      },
      { rootMargin: '0px 0px 200px 0px', threshold: 0.1 }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreCompanies, totalFilteredCompanies]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, statusFilter, storeRange, typeFilter]);

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

  const citySuggestions = useMemo(() => {
    const suggestions = new Set<string>();
    partners.forEach((partner) => {
      partner.cities.forEach((city) => suggestions.add(city));
    });
    return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [partners]);

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

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
  }, []);

  const handleCompanyFormSubmit = useCallback(
    async (values: CompanyFormValues) => {
      const payload = {
        name: values.name,
        type: values.type,
        stores: values.stores,
        total_value: values.totalValue,
        status: values.status,
        contact_name: values.contactName,
        contact_phone: values.contactPhone,
        contact_email: values.contactEmail,
      } as const;

      const state = useWaterDataStore.getState();
      const fallbackId = state.companies.allIds.length > 0 ? Math.max(...state.companies.allIds) + 1 : 1;

      try {
        let newId = fallbackId;

        if (window.api?.companies?.create) {
          const response = await window.api.companies.create(payload);
          if (!response || typeof response.id !== 'number') {
            throw new Error('Resposta inválida ao criar empresa.');
          }
          newId = response.id;
        }

        const company: Company = {
          id: newId,
          name: values.name,
          type: values.type,
          stores: values.stores,
          totalValue: values.totalValue,
          status: values.status,
          contact: {
            name: values.contactName,
            phone: values.contactPhone,
            email: values.contactEmail,
          },
        };

        useWaterDataStore.setState((current) => ({
          companies: {
            byId: { ...current.companies.byId, [company.id]: company },
            allIds: current.companies.allIds.includes(company.id)
              ? current.companies.allIds
              : [...current.companies.allIds, company.id],
          },
        }));

        showToast(`Empresa ${company.name} cadastrada com sucesso.`, 'success');
        setShowForm(false);
      } catch (error) {
        console.error('[WaterDistributionSystem] Falha ao criar empresa', error);
        const message = error instanceof Error ? error.message : 'Não foi possível salvar a empresa.';
        throw new Error(message);
      }
    },
    [showToast]
  );

  const handlePartnerFormSubmit = useCallback(
    async (values: PartnerFormValues) => {
      const payload = {
        name: values.name,
        region: values.region,
        status: values.status,
        receipts_status: values.receiptsStatus,
        contact_name: values.contactName,
        contact_phone: values.contactPhone,
        contact_email: values.contactEmail,
        cities_json: JSON.stringify(values.cities),
      } as const;

      const state = useWaterDataStore.getState();
      const fallbackId = state.partners.allIds.length > 0 ? Math.max(...state.partners.allIds) + 1 : 1;

      try {
        let newId = fallbackId;

        if (window.api?.partners?.create) {
          const response = await window.api.partners.create(payload);
          if (!response || typeof response.id !== 'number') {
            throw new Error('Resposta inválida ao criar parceiro.');
          }
          newId = response.id;
        }

        const partner: PartnerType = {
          id: newId,
          name: values.name,
          region: values.region,
          cities: values.cities,
          contact: {
            name: values.contactName,
            phone: values.contactPhone,
            email: values.contactEmail,
          },
          status: values.status,
          receiptsStatus: values.receiptsStatus,
        };

        useWaterDataStore.setState((current) => ({
          partners: {
            byId: { ...current.partners.byId, [partner.id]: partner },
            allIds: current.partners.allIds.includes(partner.id)
              ? current.partners.allIds
              : [...current.partners.allIds, partner.id],
          },
        }));

        showToast(`Parceiro ${partner.name} cadastrado com sucesso.`, 'success');
        setShowForm(false);
      } catch (error) {
        console.error('[WaterDistributionSystem] Falha ao criar parceiro', error);
        const message = error instanceof Error ? error.message : 'Não foi possível salvar o parceiro.';
        throw new Error(message);
      }
    },
    [showToast]
  );

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
    const statCards = [
      { label: 'Empresas Ativas', value: companies.length, icon: Building, tone: 'blue' as const },
      { label: 'Parceiros Ativos', value: partners.length, icon: Users, tone: 'green' as const },
      { label: 'Comprovantes Pendentes', value: pendingReceiptsCount, icon: Clock, tone: 'yellow' as const },
      { label: 'Total de Lojas', value: totalStores, icon: BarChart3, tone: 'purple' as const }
    ];

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
            statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))
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
                  <PartnerCard key={partner.id} partner={partner} />
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

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="company-search" className="block text-sm font-medium text-gray-700">
            Buscar
          </label>
          <input
            id="company-search"
            type="search"
            value={searchTerm}
            onChange={handleSearchTermChange}
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
            value={statusFilter}
            onChange={handleStatusFilterChange}
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
            value={typeFilter}
            onChange={handleTypeFilterChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            {companyTypeOptions.map((type) => (
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
            value={storeRange}
            onChange={handleStoreRangeChange}
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
              <th
                className="px-6 py-3 text-left"
                aria-sort={getAriaSort('name')}
              >
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500 focus:outline-none"
                >
                  <span>Empresa</span>
                  <span aria-hidden="true" className="text-[10px] text-gray-400">
                    {getSortIndicator('name')}
                  </span>
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
              <th
                className="px-6 py-3 text-left"
                aria-sort={getAriaSort('stores')}
              >
                <button
                  type="button"
                  onClick={() => handleSort('stores')}
                  className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500 focus:outline-none"
                >
                  <span>Lojas</span>
                  <span aria-hidden="true" className="text-[10px] text-gray-400">
                    {getSortIndicator('stores')}
                  </span>
                </button>
              </th>
              <th
                className="px-6 py-3 text-left"
                aria-sort={getAriaSort('totalValue')}
              >
                <button
                  type="button"
                  onClick={() => handleSort('totalValue')}
                  className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500 focus:outline-none"
                >
                  <span>Valor Total</span>
                  <span aria-hidden="true" className="text-[10px] text-gray-400">
                    {getSortIndicator('totalValue')}
                  </span>
                </button>
              </th>
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
            ) : visibleCompanies.length > 0 ? (
              visibleCompanies.map((company) => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  onView={handleSelectCompany}
                  onEdit={handleEditCompany}
                  onDelete={handleDeleteCompany}
                  onActionKeyDown={handleActionKeyDown}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">
                  Nenhuma empresa encontrada com os filtros selecionados.
                </td>
              </tr>
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
      {!errors.companies && !showCompaniesSkeleton && (
        <div className="px-1 py-4 text-sm text-gray-600 sm:px-0">
          <p>
            Mostrando {visibleCompanies.length} de {totalFilteredCompanies}{' '}
            {totalFilteredCompanies === 1 ? 'empresa' : 'empresas'}
            {hasMoreCompanies && <span className="ml-1 text-gray-400">Role para carregar mais resultados.</span>}
          </p>
        </div>
      )}
      <div ref={loadMoreRef} aria-hidden="true" className="h-1 w-full" />
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
                <BadgeStatus
                  label={partner.receiptsStatus === 'enviado' ? 'Comprovante enviado' : 'Comprovante pendente'}
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

  const getNextStage = useCallback((stage: ReceiptStage) => {
    const index = RECEIPT_STAGE_ORDER.indexOf(stage);
    return index >= 0 ? RECEIPT_STAGE_ORDER[index + 1] ?? null : null;
  }, []);

  const handleMoveStage = useCallback(
    (item: KanbanItem) => {
      const nextStage = getNextStage(item.stage);
      if (!nextStage) {
        showToast(`${item.company} já está no estágio final do pipeline.`, 'info');
        return;
      }

      const nextStageTitle = RECEIPT_STAGE_METADATA[nextStage].title;
      showToast(`Mover ${item.company} para "${nextStageTitle}".`, 'info');
    },
    [getNextStage, showToast]
  );

  const handleEditTotals = useCallback(
    (item: KanbanItem) => {
      showToast(`Editar totais de ${item.company}.`, 'info');
    },
    [showToast]
  );

  const handleViewHistory = useCallback(
    (item: KanbanItem) => {
      showToast(`Abrir histórico de ${item.company}.`, 'info');
    },
    [showToast]
  );

  const renderKanban = () => {
    const columnToneStyles = {
      blue: { container: 'bg-blue-50', title: 'text-blue-800' },
      yellow: { container: 'bg-yellow-50', title: 'text-yellow-800' },
      green: { container: 'bg-green-50', title: 'text-green-800' }
    } as const;

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
                    {showKanbanSkeleton
                      ? Array.from({ length: 3 }).map((_, index) => (
                          <div key={`${stage}-skeleton-${index}`} className="rounded border bg-white p-3">
                            <SkeletonLine width="w-48" />
                            <SkeletonLine className="mt-2" width="w-24" />
                            <SkeletonLine className="mt-3" width="w-full" height="h-2" />
                          </div>
                        ))
                      : kanbanColumns[stage].map((item) => (
                          <div key={item.company} className="rounded border bg-white p-3">
                            <p className="font-medium">{item.company}</p>
                            <p className="text-sm text-gray-600">
                              {item.receipts}/{item.total} {column.progressLabel}
                            </p>
                            <ProgressBar value={item.receipts} total={item.total} tone={column.tone} />
                            <div className="mt-3 flex items-center gap-2">
                              <KanbanCardActionButton
                                icon={ArrowRight}
                                label={`Mover ${item.company} para o próximo estágio`}
                                onClick={() => handleMoveStage(item)}
                              />
                              <KanbanCardActionButton
                                icon={Pencil}
                                label={`Editar totais de ${item.company}`}
                                onClick={() => handleEditTotals(item)}
                              />
                              <KanbanCardActionButton
                                icon={History}
                                label={`Histórico de alterações de ${item.company}`}
                                onClick={() => handleViewHistory(item)}
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

  const renderCompanyDetails = () => {
    if (!selectedCompany) return null;

    return (
      <OverlayDialog
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
      </OverlayDialog>
    );
  };

  const renderPartnerDetails = () => {
    if (!selectedPartner) return null;

    return (
      <OverlayDialog
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
                <BadgeStatus label="Concluído" tone="success" pill={false} />
              </div>
              <div className="flex items-center justify-between rounded bg-white p-2">
                <span className="text-sm">Outubro 2024</span>
                <BadgeStatus label="Concluído" tone="success" pill={false} />
              </div>
              <div className="flex items-center justify-between rounded bg-white p-2">
                <span className="text-sm">Setembro 2024</span>
                <BadgeStatus label="Pendente" tone="warning" pill={false} />
              </div>
            </div>
          </div>
        </div>
      </OverlayDialog>
    );
  };

  const renderForm = () => {
    if (!showForm) return null;

    const title = formType === 'company' ? 'Nova Empresa' : 'Novo Parceiro';

    return (
      <OverlayDialog
        isOpen={showForm}
        onClose={handleCloseForm}
        titleId={formDialogTitleId}
        initialFocusRef={formInitialFieldRef}
        className="max-w-2xl"
        variant="drawer"
      >
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h2 id={formDialogTitleId} className="text-2xl font-bold">
              {title}
            </h2>
            <button
              type="button"
              onClick={handleCloseForm}
              className="rounded p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Fechar formulário"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6">
          {formType === 'company' ? (
            <CompanyForm
              onSubmit={handleCompanyFormSubmit}
              onCancel={handleCloseForm}
              initialFocusRef={formInitialFieldRef}
            />
          ) : (
            <PartnerForm
              onSubmit={handlePartnerFormSubmit}
              onCancel={handleCloseForm}
              suggestions={citySuggestions}
              initialFocusRef={formInitialFieldRef}
            />
          )}
        </div>
      </OverlayDialog>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Building className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AquaDistrib Pro</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:justify-end">
              <ToolbarTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
              <ThemeToggle
                preference={themePreference}
                resolvedTheme={resolvedTheme}
                onChange={setThemePreference}
              />
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
