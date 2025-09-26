import { AlertCircle, CheckCircle } from 'lucide-react';
import type { Partner as PartnerType } from '../../types/entities';
import { cn } from '../../utils/cn';
import BadgeStatus from './BadgeStatus';

type PartnerCardProps = {
  partner: PartnerType;
  className?: string;
};

const PartnerCard = ({ partner, className }: PartnerCardProps) => {
  const isSent = partner.receiptsStatus === 'enviado';

  return (
    <div className={cn('flex items-center justify-between rounded bg-gray-50 p-3', className)}>
      <div>
        <p className="font-medium">{partner.name}</p>
        <p className="text-sm text-gray-600">{partner.region}</p>
      </div>
      <div className="flex items-center space-x-2">
        {isSent ? (
          <CheckCircle className="text-green-500" size={20} aria-hidden="true" />
        ) : (
          <AlertCircle className="text-yellow-500" size={20} aria-hidden="true" />
        )}
        <BadgeStatus
          label={isSent ? 'Enviado' : 'Pendente'}
          tone={isSent ? 'success' : 'warning'}
        />
      </div>
    </div>
  );
};

export default PartnerCard;
