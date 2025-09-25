import { useEffect, useRef, type ReactNode } from 'react';

type AccessibleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
  className?: string;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const isFocusable = (element: HTMLElement): boolean => {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  return true;
};

const AccessibleModal = ({
  isOpen,
  onClose,
  titleId,
  children,
  initialFocusRef,
  className
}: AccessibleModalProps) => {
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

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={handleOverlayMouseDown}
      aria-labelledby={titleId}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white shadow-xl focus:outline-none ${
          className ?? 'max-w-4xl'
        }`}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
};

export default AccessibleModal;
