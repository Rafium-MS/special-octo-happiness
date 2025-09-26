import { Loader2 } from 'lucide-react';
import type { PropsWithChildren } from 'react';

type SkeletonLineProps = {
  width?: string;
  height?: string;
  className?: string;
};

export const SkeletonLine = ({
  width = 'w-full',
  height = 'h-4',
  className = ''
}: SkeletonLineProps) => (
  <div className={`animate-pulse rounded bg-gray-200 ${height} ${width} ${className}`.trim()} />
);

type ErrorStateProps = PropsWithChildren<{ message?: string }>;

export const ErrorState = ({ message, children }: ErrorStateProps) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
    {message ?? children}
  </div>
);

type InlineSpinnerProps = {
  label: string;
};

export const InlineSpinner = ({ label }: InlineSpinnerProps) => (
  <div className="flex items-center space-x-2 text-sm text-gray-500">
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
    <span>{label}</span>
  </div>
);
