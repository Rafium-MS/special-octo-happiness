import { useMemo, useState } from 'react';
import { BarChart3, Building, FileText, Users } from 'lucide-react';
import ToolbarTabs from './common/ToolbarTabs';
import ThemeToggle from './common/ThemeToggle';
import { useThemePreference } from '../hooks/useThemePreference';
import DashboardView from '../views/dashboard/DashboardView';
import CompaniesView from '../views/companies/CompaniesView';
import PartnersView from '../views/partners/PartnersView';
import KanbanView from '../views/kanban/KanbanView';
import CompanyDetailsDialog from '../views/companies/CompanyDetailsDialog';
import PartnerDetailsDialog from '../views/partners/PartnerDetailsDialog';
import EntityFormDialog from '../views/companies/EntityFormDialog';
import ToastList from '../views/common/ToastList';
import { useWaterDistributionController } from '../controllers/waterDistributionController';

export type ActiveTab = 'dashboard' | 'companies' | 'partners' | 'kanban';

const WaterDistributionSystem = () => {
  const { preference: themePreference, resolvedTheme, setPreference: setThemePreference } =
    useThemePreference();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const controller = useWaterDistributionController();

  const tabs = useMemo(
    () => [
      { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
      { id: 'companies' as const, label: 'Empresas', icon: Building },
      { id: 'partners' as const, label: 'Parceiros', icon: Users },
      { id: 'kanban' as const, label: 'Pipeline', icon: FileText }
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="border-b bg-white shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-500 p-2">
                <Building className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AquaDistrib Pro</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:justify-end">
              <ToolbarTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
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
        {controller.meta.globalError && (
          <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {controller.meta.globalError}
          </div>
        )}

        {activeTab === 'dashboard' && <DashboardView dashboard={controller.dashboard} />}
        {activeTab === 'companies' && <CompaniesView companies={controller.companies} />}
        {activeTab === 'partners' && <PartnersView partners={controller.partners} />}
        {activeTab === 'kanban' && <KanbanView kanban={controller.kanban} />}
      </main>

      <CompanyDetailsDialog {...controller.dialogs.company} />
      <PartnerDetailsDialog {...controller.dialogs.partner} />
      <EntityFormDialog {...controller.dialogs.form} />

      <ToastList {...controller.toasts} />
    </div>
  );
};

export default WaterDistributionSystem;
