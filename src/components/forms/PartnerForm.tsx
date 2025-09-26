import { useEffect, useMemo, type MutableRefObject } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { RECEIPT_STATUSES, STATUSES } from '../../types/entities';
import { applyPhoneMask, isValidPhone } from '../../utils/masks';
import CityChipsInput from './CityChipsInput';

const partnerSchema = z.object({
  name: z.string().min(1, 'Informe o nome do parceiro.'),
  region: z.string().min(1, 'Informe a região de atuação.'),
  status: z.enum(STATUSES, { errorMap: () => ({ message: 'Selecione um status.' }) }),
  receiptsStatus: z.enum(RECEIPT_STATUSES, {
    errorMap: () => ({ message: 'Selecione o status dos comprovantes.' }),
  }),
  contactName: z.string().min(1, 'Informe o nome do responsável.'),
  contactPhone: z
    .string()
    .min(1, 'Informe o telefone do responsável.')
    .refine(isValidPhone, 'Informe um telefone válido.'),
  contactEmail: z.string().email('Informe um e-mail válido.'),
  cities: z
    .array(z.string().min(1, 'Cidade inválida.'))
    .min(1, 'Adicione pelo menos uma cidade de atuação.'),
});

export type PartnerFormValues = z.infer<typeof partnerSchema>;

type PartnerFormProps = {
  onSubmit: (values: PartnerFormValues) => Promise<void>;
  onCancel: () => void;
  suggestions: string[];
  initialFocusRef?: MutableRefObject<HTMLInputElement | null>;
};

const PartnerForm = ({ onSubmit, onCancel, suggestions, initialFocusRef }: PartnerFormProps) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      region: '',
      status: 'ativo',
      receiptsStatus: 'pendente',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      cities: [],
    },
  });

  useEffect(() => () => reset(), [reset]);

  const onFormSubmit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      reset({
        name: '',
        region: '',
        status: 'ativo',
        receiptsStatus: 'pendente',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        cities: [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível salvar o parceiro.';
      setError('root', { type: 'manual', message });
    }
  });

  const statusOptions = useMemo(
    () =>
      STATUSES.map((status) => ({
        value: status,
        label: status === 'ativo' ? 'Ativo' : 'Inativo',
      })),
    []
  );

  const receiptStatusOptions = useMemo(
    () =>
      RECEIPT_STATUSES.map((status) => ({
        value: status,
        label: status === 'enviado' ? 'Enviado' : 'Pendente',
      })),
    []
  );

  const nameRegistration = register('name');

  return (
    <form onSubmit={onFormSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="partner-name">
            Nome do Parceiro *
          </label>
          <input
            id="partner-name"
            {...nameRegistration}
            ref={(element) => {
              nameRegistration.ref(element);
              if (initialFocusRef) {
                initialFocusRef.current = element ?? null;
              }
            }}
            placeholder="Ex: Águas do Sul Ltda"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="partner-region">
            Região de Atuação *
          </label>
          <input
            id="partner-region"
            {...register('region')}
            placeholder="Ex: Sudeste"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.region ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="partner-status">
            Status *
          </label>
          <select
            id="partner-status"
            {...register('status')}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
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
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="partner-receipts-status">
            Status dos Comprovantes *
          </label>
          <select
            id="partner-receipts-status"
            {...register('receiptsStatus')}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.receiptsStatus ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecione</option>
            {receiptStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          {errors.receiptsStatus && <p className="mt-1 text-sm text-red-600">{errors.receiptsStatus.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cidades de Atuação *
          </label>
          <Controller
            control={control}
            name="cities"
            render={({ field }) => (
              <CityChipsInput
                value={field.value}
                onChange={field.onChange}
                suggestions={suggestions}
                placeholder="Digite uma cidade e pressione Enter"
                error={errors.cities?.message}
              />
            )}
          />
        </div>

        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold text-gray-700">Dados do Responsável</h4>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="partner-contact-name">
            Nome *
          </label>
          <input
            id="partner-contact-name"
            {...register('contactName')}
            placeholder="Nome do responsável"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.contactName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.contactName && <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="partner-contact-phone">
            Telefone *
          </label>
          <input
            id="partner-contact-phone"
            {...register('contactPhone', {
              onChange: (event) => {
                const masked = applyPhoneMask(event.target.value);
                event.target.value = masked;
              },
            })}
            placeholder="(11) 99999-0000"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.contactPhone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.contactPhone && <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="partner-contact-email">
            Email *
          </label>
          <input
            id="partner-contact-email"
            type="email"
            {...register('contactEmail')}
            placeholder="contato@empresa.com.br"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.contactEmail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.contactEmail && <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>}
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
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-green-400"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Salvar Parceiro
        </button>
      </div>
    </form>
  );
};

export default PartnerForm;
