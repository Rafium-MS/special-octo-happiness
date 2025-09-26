import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type ChangeEvent,
  type KeyboardEvent,
  type MutableRefObject
} from 'react';
import { Building, Users, Clock, BarChart3 } from 'lucide-react';
import type { Company, KanbanItem, Partner as PartnerType, ReceiptStage, Status } from '../types/entities';
import {
  useWaterDataStore,
  selectCompanies,
  selectKanbanColumns,
  selectPartners
} from '../store/useWaterDataStore';
import { RECEIPT_STAGE_METADATA, RECEIPT_STAGE_ORDER } from '../constants/receiptStageMetadata';
import type { CompanyFormValues } from '../components/forms/CompanyForm';
import type { PartnerFormValues } from '../components/forms/PartnerForm';

export type ToastTone = 'success' | 'info' | 'error';

export type ToastMessage = {
  id: string;
  message: string;
  tone: ToastTone;
};

export type SortKey = 'name' | 'stores' | 'totalValue';
export type SortDirection = 'asc' | 'desc';
export type SortConfig = { key: SortKey; direction: SortDirection };

export type StoreRangeValue = 'all' | '0-10' | '11-50' | '51-100' | '101+';
export type StatusFilterValue = 'all' | Status;

export const PAGE_SIZE = 10;

export const STORE_RANGE_OPTIONS: Array<{
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

export type StatCardData = {
  label: string;
  value: number;
  icon: typeof Building;
  tone: 'blue' | 'green' | 'yellow' | 'purple';
};

export type DashboardViewModel = {
  statCards: StatCardData[];
  showStatsSkeleton: boolean;
  combinedError: string | null;
  partners: {
    items: PartnerType[];
    showSkeleton: boolean;
    isFetching: boolean;
    error: string | null;
  };
  companies: {
    byRevenue: Company[];
    showSkeleton: boolean;
    isFetching: boolean;
    error: string | null;
  };
};

export type CompaniesViewModel = {
  filters: {
    searchTerm: string;
    status: StatusFilterValue;
    type: string;
    storeRange: StoreRangeValue;
    typeOptions: string[];
    onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onStatusChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    onTypeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    onStoreRangeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  };
  sorting: {
    config: SortConfig;
    onSort: (key: SortKey) => void;
    getIndicator: (key: SortKey) => string;
    getAriaSort: (key: SortKey) => 'ascending' | 'descending' | 'none';
  };
  pagination: {
    visibleCompanies: Company[];
    totalFilteredCompanies: number;
    hasMoreCompanies: boolean;
    sentinelRef: MutableRefObject<HTMLDivElement | null>;
  };
  states: {
    showSkeleton: boolean;
    isFetching: boolean;
    error: string | null;
  };
  actions: {
    onView: (company: Company) => void;
    onEdit: (company: Company) => void;
    onDelete: (company: Company) => void;
    onActionKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
    onOpenForm: () => void;
  };
};

export type PartnersViewModel = {
  items: PartnerType[];
  showSkeleton: boolean;
  isFetching: boolean;
  error: string | null;
  onViewDetails: (partner: PartnerType) => void;
  onOpenForm: () => void;
};

export type KanbanViewModel = {
  showSkeleton: boolean;
  isFetching: boolean;
  error: string | null;
  columns: ReturnType<typeof selectKanbanColumns>;
  onMoveStage: (item: KanbanItem) => void;
  onEditTotals: (item: KanbanItem) => void;
  onViewHistory: (item: KanbanItem) => void;
};

export type DialogsViewModel = {
  company: {
    selected: Company | null;
    titleId: string;
    titleRef: React.RefObject<HTMLHeadingElement>;
    onClose: () => void;
  };
  partner: {
    selected: PartnerType | null;
    titleId: string;
    titleRef: React.RefObject<HTMLHeadingElement>;
    onClose: () => void;
  };
  form: {
    isOpen: boolean;
    type: 'company' | 'partner';
    titleId: string;
    initialFocusRef: React.RefObject<HTMLInputElement>;
    onClose: () => void;
    onSubmitCompany: (values: CompanyFormValues) => Promise<void>;
    onSubmitPartner: (values: PartnerFormValues) => Promise<void>;
    citySuggestions: string[];
  };
};

export type ToastsViewModel = {
  items: ToastMessage[];
  onDismiss: (id: string) => void;
};

export type WaterDistributionController = {
  dashboard: DashboardViewModel;
  companies: CompaniesViewModel;
  partners: PartnersViewModel;
  kanban: KanbanViewModel;
  dialogs: DialogsViewModel;
  toasts: ToastsViewModel;
  meta: {
    globalError: string | null;
    status: ReturnType<typeof useWaterDataStore.getState>['status'];
  };
};

export const useWaterDistributionController = (): WaterDistributionController => {
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
  const [formType, setFormType] = useState<'company' | 'partner'>('company');
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

  const isIdle =
    status.companies === 'idle' && status.partners === 'idle' && status.kanban === 'idle';

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
  }, [companies, selectedCompany?.id, selectedCompany]);

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
  }, [partners, selectedPartner?.id, selectedPartner]);

  const totalKanbanItems = useMemo(
    () => RECEIPT_STAGE_ORDER.reduce((sum, stage) => sum + kanbanColumns[stage].length, 0),
    [kanbanColumns]
  );
  const isFetchingCompanies = status.companies === 'loading';
  const isFetchingPartners = status.partners === 'loading';
  const isFetchingKanban = status.kanban === 'loading';
  const showCompaniesSkeleton =
    (status.companies === 'idle' && companies.length === 0) ||
    (isFetchingCompanies && companies.length === 0);
  const showPartnersSkeleton =
    (status.partners === 'idle' && partners.length === 0) ||
    (isFetchingPartners && partners.length === 0);
  const showKanbanSkeleton =
    (status.kanban === 'idle' && totalKanbanItems === 0) ||
    (isFetchingKanban && totalKanbanItems === 0);
  const globalError = errors.companies || errors.partners || errors.kanban || null;

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
          setVisibleCount((previous) => Math.min(previous + PAGE_SIZE, totalFilteredCompanies));
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
    () => partners.filter((partner) => partner.receiptsStatus === 'pendente').length,
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
        contact_email: values.contactEmail
      } as const;

      const state = useWaterDataStore.getState();
      const fallbackId =
        state.companies.allIds.length > 0 ? Math.max(...state.companies.allIds) + 1 : 1;

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
          storesByState: null,
          totalValue: values.totalValue,
          status: values.status,
          contact: {
            name: values.contactName,
            phone: values.contactPhone,
            email: values.contactEmail
          }
        };

        useWaterDataStore.setState((current) => ({
          companies: {
            byId: { ...current.companies.byId, [company.id]: company },
            allIds: current.companies.allIds.includes(company.id)
              ? current.companies.allIds
              : [...current.companies.allIds, company.id]
          }
        }));

        showToast(`Empresa ${company.name} cadastrada com sucesso.`, 'success');
        setShowForm(false);
      } catch (error) {
        console.error('[WaterDistributionController] Falha ao criar empresa', error);
        const message =
          error instanceof Error ? error.message : 'Não foi possível salvar a empresa.';
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
        cities_json: JSON.stringify(values.cities)
      } as const;

      const state = useWaterDataStore.getState();
      const fallbackId =
        state.partners.allIds.length > 0 ? Math.max(...state.partners.allIds) + 1 : 1;

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
            email: values.contactEmail
          },
          status: values.status,
          receiptsStatus: values.receiptsStatus
        };

        useWaterDataStore.setState((current) => ({
          partners: {
            byId: { ...current.partners.byId, [partner.id]: partner },
            allIds: current.partners.allIds.includes(partner.id)
              ? current.partners.allIds
              : [...current.partners.allIds, partner.id]
          }
        }));

        showToast(`Parceiro ${partner.name} cadastrado com sucesso.`, 'success');
        setShowForm(false);
      } catch (error) {
        console.error('[WaterDistributionController] Falha ao criar parceiro', error);
        const message =
          error instanceof Error ? error.message : 'Não foi possível salvar o parceiro.';
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

  const dashboard: DashboardViewModel = {
    statCards: [
      { label: 'Empresas Ativas', value: companies.length, icon: Building, tone: 'blue' },
      { label: 'Parceiros Ativos', value: partners.length, icon: Users, tone: 'green' },
      {
        label: 'Comprovantes Pendentes',
        value: pendingReceiptsCount,
        icon: Clock,
        tone: 'yellow'
      },
      { label: 'Total de Lojas', value: totalStores, icon: BarChart3, tone: 'purple' }
    ],
    showStatsSkeleton: showCompaniesSkeleton || showPartnersSkeleton,
    combinedError: errors.companies || errors.partners || null,
    partners: {
      items: partners,
      showSkeleton: showPartnersSkeleton,
      isFetching: isFetchingPartners,
      error: errors.partners || null
    },
    companies: {
      byRevenue: companiesByRevenue,
      showSkeleton: showCompaniesSkeleton,
      isFetching: isFetchingCompanies,
      error: errors.companies || null
    }
  };

  const companiesView: CompaniesViewModel = {
    filters: {
      searchTerm,
      status: statusFilter,
      type: typeFilter,
      storeRange,
      typeOptions: companyTypeOptions,
      onSearchChange: handleSearchTermChange,
      onStatusChange: handleStatusFilterChange,
      onTypeChange: handleTypeFilterChange,
      onStoreRangeChange: handleStoreRangeChange
    },
    sorting: {
      config: sortConfig,
      onSort: handleSort,
      getIndicator: getSortIndicator,
      getAriaSort
    },
    pagination: {
      visibleCompanies,
      totalFilteredCompanies,
      hasMoreCompanies,
      sentinelRef: loadMoreRef
    },
    states: {
      showSkeleton: showCompaniesSkeleton,
      isFetching: isFetchingCompanies,
      error: errors.companies || null
    },
    actions: {
      onView: handleSelectCompany,
      onEdit: handleEditCompany,
      onDelete: handleDeleteCompany,
      onActionKeyDown: handleActionKeyDown,
      onOpenForm: handleOpenCompanyForm
    }
  };

  const partnersView: PartnersViewModel = {
    items: partners,
    showSkeleton: showPartnersSkeleton,
    isFetching: isFetchingPartners,
    error: errors.partners || null,
    onViewDetails: handleSelectPartner,
    onOpenForm: handleOpenPartnerForm
  };

  const kanbanView: KanbanViewModel = {
    showSkeleton: showKanbanSkeleton,
    isFetching: isFetchingKanban,
    error: errors.kanban || null,
    columns: kanbanColumns,
    onMoveStage: handleMoveStage,
    onEditTotals: handleEditTotals,
    onViewHistory: handleViewHistory
  };

  const dialogs: DialogsViewModel = {
    company: {
      selected: selectedCompany,
      titleId: companyDialogTitleId,
      titleRef: companyTitleRef,
      onClose: () => setSelectedCompany(null)
    },
    partner: {
      selected: selectedPartner,
      titleId: partnerDialogTitleId,
      titleRef: partnerTitleRef,
      onClose: () => setSelectedPartner(null)
    },
    form: {
      isOpen: showForm,
      type: formType,
      titleId: formDialogTitleId,
      initialFocusRef: formInitialFieldRef,
      onClose: handleCloseForm,
      onSubmitCompany: handleCompanyFormSubmit,
      onSubmitPartner: handlePartnerFormSubmit,
      citySuggestions
    }
  };

  return {
    dashboard,
    companies: companiesView,
    partners: partnersView,
    kanban: kanbanView,
    dialogs,
    toasts: {
      items: toasts,
      onDismiss: dismissToast
    },
    meta: {
      globalError,
      status
    }
  };
};
