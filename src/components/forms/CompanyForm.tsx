import { useEffect, type MutableRefObject } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { STATUSES } from '../../types/entities';
import { applyPhoneMask, isValidPhone } from '../../utils/masks';

const companySchema = z.object({
  name: z.string().min(1, 'Informe o nome da empresa.'),
  type: z.string().min(1, 'Informe o segmento da empresa.'),
  stores: z
    .number({ invalid_type_error: 'Informe o número de lojas.' })
    .min(0, 'O número de lojas deve ser maior ou igual a zero.'),
  totalValue: z
    .number({ invalid_type_error: 'Informe o valor total mensal.' })
    .min(0, 'O valor total deve ser maior ou igual a zero.'),
  status: z.enum(STATUSES, { errorMap: () => ({ message: 'Selecione um status.' }) }),
  contactName: z.string().min(1, 'Informe o nome do responsável.'),
  contactPhone: z
    .string()
    .min(1, 'Informe o telefone do responsável.')
    .refine(isValidPhone, 'Informe um telefone válido.'),
  contactEmail: z.string().email('Informe um e-mail válido.'),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

type CompanyFormProps = {
  onSubmit: (values: CompanyFormValues) => Promise<void>;
  onCancel: () => void;
  initialFocusRef?: MutableRefObject<HTMLInputElement | null>;
  initialValues?: CompanyFormValues | null;
  submitLabel?: string;
};

const DEFAULT_VALUES: CompanyFormValues = {
  name: '',
  type: '',
  stores: 0,
  totalValue: 0,
  status: 'ativo',
  contactName: '',
  contactPhone: '',
  contactEmail: ''
};

const CompanyForm = ({
  onSubmit,
  onCancel,
  initialFocusRef,
  initialValues,
  submitLabel = 'Salvar Empresa'
}: CompanyFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: initialValues ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    reset(initialValues ?? DEFAULT_VALUES);
  }, [initialValues, reset]);

  const onFormSubmit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      reset(initialValues ? values : DEFAULT_VALUES);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível salvar a empresa.';
      setError('root', { type: 'manual', message });
    }
  });

  const statusOptions = STATUSES.map((status) => ({
    value: status,
    label: status === 'ativo' ? 'Ativo' : 'Inativo',
  }));

  const nameRegistration = register('name');

  return (
    <form onSubmit={onFormSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="company-name">
            Nome da Empresa *
          </label>
          <input
            id="company-name"
            {...nameRegistration}
            ref={(element) => {
              nameRegistration.ref(element);
              if (initialFocusRef) {
                initialFocusRef.current = element ?? null;
              }
            }}
            placeholder="Ex: ANIMALE"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="company-type">
            Tipo de Negócio *
          </label>
          <input
            id="company-type"
            {...register('type')}
            placeholder="Ex: Moda Feminina"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="company-stores">
            Número de Lojas *
          </label>
          <input
            id="company-stores"
            type="number"
            step={1}
            min={0}
            {...register('stores', { valueAsNumber: true })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.stores ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.stores && <p className="mt-1 text-sm text-red-600">{errors.stores.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="company-total-value">
            Valor Total Mensal (R$) *
          </label>
          <input
            id="company-total-value"
            type="number"
            step="0.01"
            min={0}
            {...register('totalValue', { valueAsNumber: true })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.totalValue ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.totalValue && <p className="mt-1 text-sm text-red-600">{errors.totalValue.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="company-status">
            Status *
          </label>
          <select
            id="company-status"
            {...register('status')}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.status ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecione</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="company-contact-email">
            Email do Responsável *
          </label>
          <input
            id="company-contact-email"
            type="email"
            {...register('contactEmail')}
            placeholder="nome@empresa.com.br"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.contactEmail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.contactEmail && <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>}
        </div>

        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold text-gray-700">Dados do Responsável</h4>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="company-contact-name">
            Nome *
          </label>
          <input
            id="company-contact-name"
            {...register('contactName')}
            placeholder="Nome do responsável"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.contactName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.contactName && <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="company-contact-phone">
            Telefone *
          </label>
          <input
            id="company-contact-phone"
            {...register('contactPhone', {
              onChange: (event) => {
                const masked = applyPhoneMask(event.target.value);
                event.target.value = masked;
              },
            })}
            placeholder="(11) 99999-0000"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.contactPhone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.contactPhone && <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>}
        </div>
      </div>

      {errors.root && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default CompanyForm;
