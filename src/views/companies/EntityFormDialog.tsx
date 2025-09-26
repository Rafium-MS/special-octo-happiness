import CompanyForm from '../../components/forms/CompanyForm';
import PartnerForm from '../../components/forms/PartnerForm';
import OverlayDialog from '../../components/ui/OverlayDialog';
import type { DialogsViewModel } from '../../controllers/waterDistributionController';

const EntityFormDialog = ({
  isOpen,
  type,
  mode,
  titleId,
  initialFocusRef,
  onClose,
  onSubmitCompany,
  onSubmitPartner,
  citySuggestions,
  companyInitialValues,
  partnerInitialValues
}: DialogsViewModel['form']) => {
  if (!isOpen) return null;

  const title =
    type === 'company'
      ? mode === 'edit'
        ? 'Editar Empresa'
        : 'Nova Empresa'
      : mode === 'edit'
        ? 'Editar Parceiro'
        : 'Novo Parceiro';

  const submitLabel =
    type === 'company'
      ? mode === 'edit'
        ? 'Atualizar Empresa'
        : 'Salvar Empresa'
      : mode === 'edit'
        ? 'Atualizar Parceiro'
        : 'Salvar Parceiro';

  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      initialFocusRef={initialFocusRef}
      className="max-w-2xl"
      variant="drawer"
    >
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-2xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Fechar formulário"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="p-6">
        {type === 'company' ? (
          <CompanyForm
            onSubmit={onSubmitCompany}
            onCancel={onClose}
            initialFocusRef={initialFocusRef}
            initialValues={companyInitialValues}
            submitLabel={submitLabel}
          />
        ) : (
          <PartnerForm
            onSubmit={onSubmitPartner}
            onCancel={onClose}
            suggestions={citySuggestions}
            initialFocusRef={initialFocusRef}
            initialValues={partnerInitialValues}
            submitLabel={submitLabel}
          />
        )}
      </div>
    </OverlayDialog>
  );
};

export default EntityFormDialog;
