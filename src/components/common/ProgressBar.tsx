import { cn } from '../../utils/cn';

export type ProgressTone = 'blue' | 'green' | 'yellow';

type ProgressBarProps = {
  value: number;
  total: number;
  tone?: ProgressTone;
  className?: string;
};

const toneStyles: Record<ProgressTone, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500'
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const ProgressBar = ({ value, total, tone = 'blue', className }: ProgressBarProps) => {
  const ratio = total > 0 ? value / total : 0;
  const safeRatio = Number.isFinite(ratio) ? ratio : 0;
  const percentage = clamp(safeRatio * 100, 0, 100);

  return (
    <div className={cn('mt-2 h-2 w-full rounded-full bg-gray-200', className)}>
      <div
        className={cn('h-2 rounded-full transition-all', toneStyles[tone])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;
