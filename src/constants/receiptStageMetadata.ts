import { CheckCircle, FileText, Upload, type LucideIcon } from 'lucide-react';
import { RECEIPT_STAGES, type ReceiptStage } from '../types/entities';
import type { ProgressTone } from '../components/common/ProgressBar';

export type ReceiptStageMetadata = {
  title: string;
  tone: ProgressTone;
  icon: LucideIcon;
  progressLabel: string;
};

export const RECEIPT_STAGE_METADATA: Record<ReceiptStage, ReceiptStageMetadata> = {
  recebimento: {
    title: 'Recebimento de Comprovantes',
    tone: 'blue',
    icon: Upload,
    progressLabel: 'comprovantes'
  },
  relatorio: {
    title: 'Relatório Preenchido',
    tone: 'yellow',
    icon: FileText,
    progressLabel: 'processados'
  },
  nota_fiscal: {
    title: 'Nota Fiscal Pronta',
    tone: 'green',
    icon: CheckCircle,
    progressLabel: 'finalizados'
  }
};

export const RECEIPT_STAGE_ORDER = [...RECEIPT_STAGES];
