import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

type StatCardTone = 'blue' | 'green' | 'yellow' | 'purple';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatCardTone;
};

const toneStyles: Record<StatCardTone, { container: string; label: string; value: string; icon: string }> = {
  blue: {
    container: 'border-blue-200 bg-blue-50',
    label: 'text-blue-600',
    value: 'text-blue-800',
    icon: 'text-blue-500'
  },
  green: {
    container: 'border-green-200 bg-green-50',
    label: 'text-green-600',
    value: 'text-green-800',
    icon: 'text-green-500'
  },
  yellow: {
    container: 'border-yellow-200 bg-yellow-50',
    label: 'text-yellow-600',
    value: 'text-yellow-800',
    icon: 'text-yellow-500'
  },
  purple: {
    container: 'border-purple-200 bg-purple-50',
    label: 'text-purple-600',
    value: 'text-purple-800',
    icon: 'text-purple-500'
  }
};

const StatCard = ({ label, value, icon: Icon, tone = 'blue' }: StatCardProps) => {
  const styles = toneStyles[tone];

  return (
    <div className={cn('rounded-lg border p-4', styles.container)}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn('text-sm font-medium', styles.label)}>{label}</p>
          <p className={cn('text-2xl font-bold', styles.value)}>{value}</p>
        </div>
        <Icon className={cn('h-6 w-6', styles.icon)} aria-hidden="true" />
      </div>
    </div>
  );
};

export default StatCard;
