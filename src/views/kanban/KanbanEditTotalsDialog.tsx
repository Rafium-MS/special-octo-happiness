import { useEffect, useId, useState } from 'react';
import OverlayDialog from '../../components/ui/OverlayDialog';
import { RECEIPT_STAGE_METADATA } from '../../constants/receiptStageMetadata';
import type { DialogsViewModel } from '../../controllers/waterDistributionController';

const numberInputClasses =
  'w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

const labelClasses = 'block text-sm font-medium text-gray-700';

const errorClasses = 'mt-2 text-sm text-red-600';

type KanbanTotalsDialogProps = DialogsViewModel['kanbanTotals'];

type FormEvent = React.FormEvent<HTMLFormElement>;

type TotalsChangeEvent = React.ChangeEvent<HTMLInputElement>;

type TotalsSubmitValues = { receipts: number; total: number };

const KanbanEditTotalsDialog = ({ isOpen, item, titleId, onClose, onConfirm }: KanbanTotalsDialogProps) => {
  const [receipts, setReceipts] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const descriptionId = useId();

  useEffect(() => {
    if (item && isOpen) {
      setReceipts(item.receipts);
      setTotal(item.total);
      setError(null);
    }
  }, [item, isOpen]);

  if (!item) {
    return null;
  }

  const stageTitle = RECEIPT_STAGE_METADATA[item.stage].title;

  const handleChange = (setter: (value: number) => void) => (event: TotalsChangeEvent) => {
    const nextValue = Number.parseInt(event.target.value, 10);
    setter(Number.isNaN(nextValue) ? 0 : nextValue);
  };

  const validate = (values: TotalsSubmitValues): string | null => {
    if (values.total <= 0) {
      return 'O total de comprovantes deve ser maior que zero.';
    }
    if (values.receipts < 0) {
      return 'Os comprovantes processados não podem ser negativos.';
    }
    if (values.receipts > values.total) {
      return 'Os comprovantes processados não podem exceder o total.';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const values = { receipts, total };
    const validationError = validate(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(values);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível atualizar os totais.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OverlayDialog isOpen={isOpen} onClose={onClose} titleId={titleId} size="md">
      <form onSubmit={handleSubmit} aria-describedby={descriptionId}>
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="text-xl font-semibold text-gray-900">
              Ajustar totais de {item.company}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Fechar edição de totais"
            >
              ✕
            </button>
          </div>
          <p id={descriptionId} className="mt-2 text-sm text-gray-600">
            Atualize os comprovantes processados e o total esperado para o estágio "{stageTitle}".
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label htmlFor="receipts" className={labelClasses}>
              Comprovantes processados
            </label>
            <input
              id="receipts"
              name="receipts"
              type="number"
              inputMode="numeric"
              min={0}
              value={receipts}
              onChange={handleChange(setReceipts)}
              className={numberInputClasses}
              aria-describedby="receipts-help"
            />
            <p id="receipts-help" className="mt-1 text-xs text-gray-500">
              Valor atual: {item.receipts}
            </p>
          </div>

          <div>
            <label htmlFor="total" className={labelClasses}>
              Total de comprovantes
            </label>
            <input
              id="total"
              name="total"
              type="number"
              inputMode="numeric"
              min={1}
              value={total}
              onChange={handleChange(setTotal)}
              className={numberInputClasses}
              aria-describedby="total-help"
            />
            <p id="total-help" className="mt-1 text-xs text-gray-500">
              Valor atual: {item.total}
            </p>
          </div>

          {error && <p className={errorClasses}>{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t bg-gray-50 p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </OverlayDialog>
  );
};

export default KanbanEditTotalsDialog;
