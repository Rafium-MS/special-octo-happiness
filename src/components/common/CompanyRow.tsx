import { Edit, Eye, Trash2 } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import type { Company } from '../../services/dataService';
import { formatCurrency } from '../../utils/formatters';
import BadgeStatus from './BadgeStatus';

type CompanyRowProps = {
  company: Company;
  onView: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onActionKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
};

const CompanyRow = ({ company, onView, onEdit, onDelete, onActionKeyDown }: CompanyRowProps) => (
  <tr>
    <td className="px-6 py-4">
      <div>
        <p className="font-medium">{company.name}</p>
        <p className="text-sm text-gray-600">{company.contact.name}</p>
      </div>
    </td>
    <td className="px-6 py-4 text-sm text-gray-900">{company.type}</td>
    <td className="px-6 py-4 text-sm text-gray-900">{company.stores}</td>
    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(company.totalValue)}</td>
    <td className="px-6 py-4">
      <BadgeStatus
        label={company.status}
        tone={company.status === 'ativo' ? 'success' : 'danger'}
      />
    </td>
    <td className="px-6 py-4">
      <div className="flex space-x-2" role="group" aria-label={`Ações disponíveis para ${company.name}`}>
        <button
          type="button"
          onClick={() => onView(company)}
          onKeyDown={onActionKeyDown}
          className="text-blue-600 transition hover:text-blue-800"
          aria-label={`Ver detalhes da empresa ${company.name}`}
        >
          <Eye size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(company)}
          onKeyDown={onActionKeyDown}
          className="text-green-600 transition hover:text-green-800"
          aria-label={`Editar empresa ${company.name}`}
        >
          <Edit size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(company)}
          onKeyDown={onActionKeyDown}
          className="text-red-600 transition hover:text-red-800"
          aria-label={`Excluir empresa ${company.name}`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </td>
  </tr>
);

export default CompanyRow;
