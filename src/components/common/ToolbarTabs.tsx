import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

type ToolbarTabsProps<T extends string> = {
  tabs: Array<{ id: T; label: string; icon: LucideIcon }>;
  activeTab: T;
  onTabChange: (tab: T) => void;
};

const ToolbarTabs = <T extends string>({ tabs, activeTab, onTabChange }: ToolbarTabsProps<T>) => (
  <div className="flex flex-wrap gap-2 md:flex-nowrap">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={cn(
          'flex min-w-[8rem] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'md:min-w-0 md:flex-none md:justify-start',
          activeTab === tab.id
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <tab.icon size={18} aria-hidden="true" />
        <span>{tab.label}</span>
      </button>
    ))}
  </div>
);

export default ToolbarTabs;
