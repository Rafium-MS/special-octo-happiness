import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

type ToolbarTabsProps<T extends string> = {
  tabs: Array<{ id: T; label: string; icon: LucideIcon }>;
  activeTab: T;
  onTabChange: (tab: T) => void;
};

const ToolbarTabs = <T extends string>({ tabs, activeTab, onTabChange }: ToolbarTabsProps<T>) => (
  <div className="flex space-x-1">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={cn(
          'flex items-center space-x-2 rounded-lg px-4 py-2 font-medium transition-colors',
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
