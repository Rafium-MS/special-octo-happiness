import { cn } from '../../utils/cn';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type BadgeStatusProps = {
  label: string;
  tone?: BadgeTone;
  pill?: boolean;
  className?: string;
};

const toneStyles: Record<BadgeTone, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-700'
};

const BadgeStatus = ({ label, tone = 'neutral', pill = true, className }: BadgeStatusProps) => (
  <span
    className={cn(
      'px-2 py-1 text-xs font-medium',
      pill ? 'rounded-full' : 'rounded',
      toneStyles[tone],
      className
    )}
  >
    {label}
  </span>
);

export default BadgeStatus;
