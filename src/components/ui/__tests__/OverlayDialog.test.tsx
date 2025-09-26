import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import OverlayDialog from '../OverlayDialog';

describe('OverlayDialog', () => {
  it('focuses the provided initial element when opened', async () => {
    const onClose = vi.fn();
    const initialFocusRef = createRef<HTMLButtonElement>();

    render(
      <OverlayDialog
        isOpen
        onClose={onClose}
        titleId="dialog-title"
        initialFocusRef={initialFocusRef}
      >
        <button ref={initialFocusRef}>Primeiro botão</button>
        <button>Segundo botão</button>
      </OverlayDialog>
    );

    await screen.findByRole('dialog');
    expect(initialFocusRef.current).not.toBeNull();
    await waitFor(() => {
      expect(initialFocusRef.current).toHaveFocus();
    });
  });

  it('closes when pressing Escape and when clicking on the overlay', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <OverlayDialog isOpen onClose={onClose} titleId="dialog-title">
        <button>Conteúdo</button>
      </OverlayDialog>
    );

    const overlay = screen.getByRole('dialog');

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('applies variant-specific classes for modal and drawer modes', () => {
    const { rerender } = render(
      <OverlayDialog isOpen onClose={vi.fn()} titleId="modal">
        <div>Modal content</div>
      </OverlayDialog>
    );

    const modalOverlay = screen.getByRole('dialog');
    const modalPanel = modalOverlay.firstElementChild as HTMLElement | null;
    expect(modalPanel).not.toBeNull();
    expect(modalPanel).toHaveClass('rounded-lg');

    rerender(
      <OverlayDialog
        isOpen
        onClose={vi.fn()}
        titleId="drawer"
        variant="drawer"
        position="left"
        size="sm"
      >
        <div>Drawer content</div>
      </OverlayDialog>
    );

    const drawerOverlay = screen.getByRole('dialog');
    const drawerPanel = drawerOverlay.firstElementChild as HTMLElement | null;
    expect(drawerPanel).not.toBeNull();
    expect(drawerPanel).toHaveClass('h-full');
    expect(drawerPanel).toHaveClass('ml-0');
  });
});
