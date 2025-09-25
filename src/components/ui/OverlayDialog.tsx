import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

type OverlayDialogVariant = 'modal' | 'drawer';
type DrawerPosition = 'left' | 'right';
type OverlayDialogSize = 'sm' | 'md' | 'lg' | 'xl';

type OverlayDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
  className?: string;
  variant?: OverlayDialogVariant;
  position?: DrawerPosition;
  size?: OverlayDialogSize;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const isFocusable = (element: HTMLElement): boolean => {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  return true;
};

const variantStyles: Record<OverlayDialogVariant, string> = {
  modal: 'max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white shadow-xl',
  drawer: 'h-full w-full overflow-y-auto bg-white shadow-xl'
};

const modalSizeStyles: Record<OverlayDialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl'
};

const drawerSizeStyles: Record<OverlayDialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl'
};

const overlayAlignment: Record<OverlayDialogVariant, string> = {
  modal: 'items-center justify-center',
  drawer: 'items-stretch justify-end'
};

const OverlayDialog = ({
  isOpen,
  onClose,
  titleId,
  children,
  initialFocusRef,
  className,
  variant = 'modal',
  position = 'right',
  size = 'lg'
}: OverlayDialogProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    if (dialog) {
      const target =
        initialFocusRef?.current ||
        (dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? null);
      target?.focus({ preventScroll: true });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!dialog?.contains(event.target as Node)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter(isFocusable);

        if (focusable.length === 0) {
          event.preventDefault();
          dialog.focus();
          return;
        }

        const currentIndex = focusable.findIndex(
          (element) => element === document.activeElement
        );

        if (event.shiftKey) {
          if (currentIndex <= 0) {
            event.preventDefault();
            focusable[focusable.length - 1]?.focus();
          }
        } else if (currentIndex === focusable.length - 1) {
          event.preventDefault();
          focusable[0]?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [initialFocusRef, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      onClose();
    }
  };

  const positionClass = variant === 'drawer' && position === 'left' ? 'justify-start' : undefined;

  return (
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 z-50 flex bg-black/60',
        variant === 'drawer' ? 'p-0 md:p-4' : 'p-4',
        overlayAlignment[variant],
        positionClass
      )}
      onMouseDown={handleOverlayMouseDown}
      aria-labelledby={titleId}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className={cn(
          variantStyles[variant],
          variant === 'modal' ? modalSizeStyles[size] : drawerSizeStyles[size],
          variant === 'drawer' ? 'ml-auto h-full' : undefined,
          variant === 'drawer' && position === 'left' ? 'ml-0 mr-auto' : undefined,
          className
        )}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
};

export default OverlayDialog;
