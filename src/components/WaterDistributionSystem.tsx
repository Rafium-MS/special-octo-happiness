import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Building, Users, FileText, BarChart3, CheckCircle, Clock, AlertCircle, Plus, MapPin, Phone, Mail, Edit, Trash2, Eye, Upload } from 'lucide-react';
import type { Company, Partner as PartnerType } from '../services/dataService';
import { selectCompanies, selectKanbanColumns, selectPartners, useWaterDataStore } from '../store/useWaterDataStore';
import { formatCurrency, formatEmail, formatPhone } from '../utils/formatters';

type ActiveTab = 'dashboard' | 'companies' | 'partners' | 'kanban';
type FormType = 'company' | 'partner';
type FormValues = Partial<{
  name: string;
  type: string;
  stores: number;
  totalValue: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  region: string;
  cities: string[];
}>;

const WaterDistributionSystem = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const companies = useWaterDataStore(selectCompanies);
  const partners = useWaterDataStore(selectPartners);
  const kanbanColumns = useWaterDataStore(selectKanbanColumns);
  const metaSelector = useCallback(
    (state: ReturnType<typeof useWaterDataStore.getState>) => ({
      fetchAll: state.fetchAll,
      status: state.status,
      errors: state.errors
    }),
    []
  );
  const { fetchAll, status, errors } = useWaterDataStore(metaSelector);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<FormType>('company');
  const [formData, setFormData] = useState<FormValues>({});

  const isIdle = status.companies === 'idle' && status.partners === 'idle' && status.kanban === 'idle';

  useEffect(() => {
    if (isIdle) {
      fetchAll();
    }
  }, [fetchAll, isIdle]);

  useEffect(() => {
    if (!selectedCompany) return;
    const updated = companies.find((company) => company.id === selectedCompany.id);
    if (!updated) {
      setSelectedCompany(null);
      return;
    }
    if (updated !== selectedCompany) {
      setSelectedCompany(updated);
    }
  }, [companies, selectedCompany?.id]);

  useEffect(() => {
    if (!selectedPartner) return;
    const updated = partners.find((partner) => partner.id === selectedPartner.id);
    if (!updated) {
      setSelectedPartner(null);
      return;
    }
    if (updated !== selectedPartner) {
      setSelectedPartner(updated);
    }
  }, [partners, selectedPartner?.id]);

  const globalError = errors.companies || errors.partners || errors.kanban;
  const isLoading =
    (status.companies === 'loading' || status.partners === 'loading' || status.kanban === 'loading') &&
    companies.length === 0 &&
    partners.length === 0;

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Empresas Ativas</p>
              <p className="text-2xl font-bold text-blue-800">{companies.length}</p>
            </div>
            <Building className="text-blue-500" size={24} />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Parceiros Ativos</p>
              <p className="text-2xl font-bold text-green-800">{partners.length}</p>
            </div>
            <Users className="text-green-500" size={24} />
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Comprovantes Pendentes</p>
              <p className="text-2xl font-bold text-yellow-800">
                {partners.filter(p => p.receiptsStatus === 'pendente').length}
              </p>
            </div>
            <Clock className="text-yellow-500" size={24} />
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total de Lojas</p>
              <p className="text-2xl font-bold text-purple-800">
                {companies.reduce((acc, comp) => acc + comp.stores, 0)}
              </p>
            </div>
            <BarChart3 className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Status dos Parceiros</h3>
          <div className="space-y-3">
            {partners.map(partner => (
              <div key={partner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{partner.name}</p>
                  <p className="text-sm text-gray-600">{partner.region}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {partner.receiptsStatus === 'enviado' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <AlertCircle className="text-yellow-500" size={20} />
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    partner.receiptsStatus === 'enviado' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {partner.receiptsStatus === 'enviado' ? 'Enviado' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Empresas por Faturamento</h3>
          <div className="space-y-3">
            {companies
              .sort((a, b) => b.totalValue - a.totalValue)
              .map(company => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-gray-600">{company.stores} lojas</p>
                  </div>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(company.totalValue)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompanies = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Empresas Cadastradas</h2>
        <button
          onClick={() => { setShowForm(true); setFormType('company'); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600"
        >
          <Plus size={20} />
          <span>Nova Empresa</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lojas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map(company => (
              <tr key={company.id}>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-gray-600">{company.contact.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{company.type}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{company.stores}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatCurrency(company.totalValue)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    company.status === 'ativo' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {company.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedCompany(company)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={16} />
                    </button>
                    <button className="text-green-600 hover:text-green-800">
                      <Edit size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPartners = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Parceiros Distribuidores</h2>
        <button
          onClick={() => { setShowForm(true); setFormType('partner'); }}
          className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-600"
        >
          <Plus size={20} />
          <span>Novo Parceiro</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map(partner => (
          <div key={partner.id} className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{partner.name}</h3>
              <div className="flex items-center space-x-2">
                {partner.receiptsStatus === 'enviado' ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <AlertCircle className="text-yellow-500" size={20} />
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <MapPin className="mr-2" size={16} />
                <span>{partner.region}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="mr-2" size={16} />
                <span>{formatPhone(partner.contact.phone)}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="mr-2" size={16} />
                <span>{formatEmail(partner.contact.email)}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Cidades de atuação:</p>
              <div className="flex flex-wrap gap-1">
                {partner.cities.map(city => (
                  <span key={city} className="px-2 py-1 bg-gray-100 text-xs rounded">
                    {city}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  partner.receiptsStatus === 'enviado' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  Comprovantes: {partner.receiptsStatus === 'enviado' ? 'Enviados' : 'Pendentes'}
                </span>
                <button
                  onClick={() => setSelectedPartner(partner)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderKanban = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Pipeline de Processamento</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
            <Upload className="mr-2" size={20} />
            Recebimento de Comprovantes
          </h3>
          <div className="space-y-3">
            {kanbanColumns.recebimento.map(item => (
              <div key={item.company} className="bg-white p-3 rounded border">
                <p className="font-medium">{item.company}</p>
                <p className="text-sm text-gray-600">
                  {item.receipts}/{item.total} comprovantes
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{width: `${(item.receipts/item.total)*100}%`}}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-4 flex items-center">
            <FileText className="mr-2" size={20} />
            Relatório Preenchido
          </h3>
          <div className="space-y-3">
            {kanbanColumns.relatorio.map(item => (
              <div key={item.company} className="bg-white p-3 rounded border">
                <p className="font-medium">{item.company}</p>
                <p className="text-sm text-gray-600">
                  {item.receipts}/{item.total} processados
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{width: `${(item.receipts/item.total)*100}%`}}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-4 flex items-center">
            <CheckCircle className="mr-2" size={20} />
            Nota Fiscal Pronta
          </h3>
          <div className="space-y-3">
            {kanbanColumns.nota_fiscal.map(item => (
              <div key={item.company} className="bg-white p-3 rounded border">
                <p className="font-medium">{item.company}</p>
                <p className="text-sm text-gray-600">
                  {item.receipts}/{item.total} finalizados
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{width: `${(item.receipts/item.total)*100}%`}}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompanyDetails = () => {
    if (!selectedCompany) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-90vh overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedCompany.name}</h2>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações da Empresa</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Tipo:</span> {selectedCompany.type}</p>
                  <p><span className="font-medium">Total de Lojas:</span> {selectedCompany.stores}</p>
                  <p><span className="font-medium">Valor Total:</span> {formatCurrency(selectedCompany.totalValue)}</p>
                  <p><span className="font-medium">Status:</span> {selectedCompany.status}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Contato Responsável</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nome:</span> {selectedCompany.contact.name}</p>
                  <p><span className="font-medium">Telefone:</span> {formatPhone(selectedCompany.contact.phone)}</p>
                  <p><span className="font-medium">Email:</span> {formatEmail(selectedCompany.contact.email)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Lojas por Estado</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-lg text-blue-600">25</p>
                    <p className="text-gray-600">São Paulo</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-lg text-green-600">18</p>
                    <p className="text-gray-600">Rio de Janeiro</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-lg text-purple-600">15</p>
                    <p className="text-gray-600">Minas Gerais</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-lg text-orange-600">31</p>
                    <p className="text-gray-600">Outros Estados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPartnerDetails = () => {
    if (!selectedPartner) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-90vh overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedPartner.name}</h2>
              <button
                onClick={() => setSelectedPartner(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações do Parceiro</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Região de Atuação:</span> {selectedPartner.region}</p>
                  <p><span className="font-medium">Status:</span> {selectedPartner.status}</p>
                  <p><span className="font-medium">Comprovantes:</span> {selectedPartner.receiptsStatus === 'enviado' ? 'Enviados' : 'Pendentes'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Dados de Contato</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Users className="mr-2 text-gray-400" size={16} />
                    <span>{selectedPartner.contact.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-2 text-gray-400" size={16} />
                    <span>{formatPhone(selectedPartner.contact.phone)}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="mr-2 text-gray-400" size={16} />
                    <span>{formatEmail(selectedPartner.contact.email)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Cidades de Atuação</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedPartner.cities.map(city => (
                  <div key={city} className="bg-blue-50 p-3 rounded-lg text-center">
                    <MapPin className="mx-auto mb-1 text-blue-500" size={20} />
                    <p className="font-medium text-blue-800">{city}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Histórico de Entregas</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-sm">Novembro 2024</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Concluído</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-sm">Outubro 2024</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Concluído</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-sm">Setembro 2024</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Pendente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderForm = () => {
    if (!showForm) return null;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Aqui você adicionaria a lógica para salvar os dados
      console.warn('Salvar formulário ainda não implementado:', formData);
      setShowForm(false);
      setFormData({});
    };

    const handleInputChange = <Field extends keyof FormValues>(field: Field, value: FormValues[Field]) => {
      setFormData((previous) => ({ ...previous, [field]: value }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {formType === 'company' ? 'Nova Empresa' : 'Novo Parceiro'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {formType === 'company' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: ANIMALE"
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Negócio *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Moda Feminina"
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Lojas
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 89"
                      onChange={(e) => handleInputChange('stores', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Total Mensal
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 15420.50"
                      onChange={(e) => handleInputChange('totalValue', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Dados do Responsável</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do responsável"
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                    />
                    <input
                      type="tel"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Telefone"
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                    <input
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Email"
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Parceiro *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: Águas do Sul Ltda"
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Região de Atuação *
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    required
                  >
                    <option value="">Selecione a região</option>
                    <option value="Norte">Norte</option>
                    <option value="Nordeste">Nordeste</option>
                    <option value="Centro-Oeste">Centro-Oeste</option>
                    <option value="Sudeste">Sudeste</option>
                    <option value="Sul">Sul</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidades de Atuação
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Separe as cidades por vírgula"
                    onChange={(e) => handleInputChange('cities', e.target.value.split(',').map(city => city.trim()))}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Dados do Responsável</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nome do responsável"
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                    />
                    <input
                      type="tel"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Telefone"
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                    <input
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Email"
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white rounded-lg ${
                  formType === 'company' 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Building className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AquaDistrib Pro</h1>
            </div>

            <div className="flex space-x-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'companies', label: 'Empresas', icon: Building },
                { id: 'partners', label: 'Parceiros', icon: Users },
                { id: 'kanban', label: 'Pipeline', icon: FileText }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {globalError && (
          <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {globalError}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            Carregando dados do sistema...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'companies' && renderCompanies()}
            {activeTab === 'partners' && renderPartners()}
            {activeTab === 'kanban' && renderKanban()}
          </>
        )}
      </main>

      {selectedCompany && renderCompanyDetails()}
      {selectedPartner && renderPartnerDetails()}
    </div>
  );
};

export default WaterDistributionSystem;
