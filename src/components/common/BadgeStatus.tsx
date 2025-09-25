import { cn } from '../../utils/cn';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type BadgeStatusProps = {
  label: string;
  tone?: BadgeTone;
  pill?: boolean;
  className?: string;
};

const toneStyles: Record<BadgeTone, string> = {
  success: 'badge--success',
  warning: 'badge--warning',
  danger: 'badge--danger',
  info: 'badge--info',
  neutral: 'badge--neutral'
};

const BadgeStatus = ({ label, tone = 'neutral', pill = true, className }: BadgeStatusProps) => (
  <span
    className={cn(
      'badge',
      pill ? 'badge--pill' : '',
      toneStyles[tone],
      className
    )}
  >
    {label}
  </span>
);

export default BadgeStatus;
