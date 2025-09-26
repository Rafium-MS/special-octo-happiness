import type { ToastMessage, ToastTone } from '../../controllers/waterDistributionController';

type ToastListProps = {
  items: ToastMessage[];
  onDismiss: (id: string) => void;
};

const toneStyles: Record<ToastTone, string> = {
  success: 'border-green-200 bg-green-50 text-green-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  error: 'border-red-200 bg-red-50 text-red-900'
};

const ToastList = ({ items, onDismiss }: ToastListProps) => {
  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col space-y-2"
      role="status"
      aria-live="polite"
    >
      {items.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border p-4 shadow-md transition ${toneStyles[toast.tone]}`}
          data-testid="toast-message"
        >
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="ml-4 text-sm text-current transition hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Fechar notificação"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastList;
