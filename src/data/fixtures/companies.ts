import type { RawCompany } from '../../types/ipc';

const companies: RawCompany[] = [
  {
    id: 1,
    name: 'ANIMALE',
    type: 'Moda Feminina',
    stores: 89,
    stores_by_state_json: JSON.stringify({
      SP: 25,
      RJ: 18,
      MG: 15,
      PR: 10,
      RS: 8,
      Outros: 13,
    }),
    total_value: 15420.5,
    status: 'ativo',
    contact_name: 'Maria Silva',
    contact_phone: '(11) 99999-9999',
    contact_email: 'contato@animale.com.br'
  },
  {
    id: 2,
    name: 'AREZZO',
    type: 'Calçados e Acessórios',
    stores: 14,
    stores_by_state_json: null,
    total_value: 8350.75,
    status: 'ativo',
    contact_name: 'João Santos',
    contact_phone: '(11) 88888-8888',
    contact_email: 'parceria@arezzo.com.br'
  },
  {
    id: 3,
    name: 'BAGAGGIO',
    type: 'Artefatos de Couro',
    stores: 29,
    stores_by_state_json: JSON.stringify({
      SP: 12,
      RJ: 7,
      MG: 4,
      ES: 3,
      Outros: 3,
    }),
    total_value: 12200.25,
    status: 'ativo',
    contact_name: 'Ana Costa',
    contact_phone: '(11) 77777-7777',
    contact_email: 'suprimentos@bagaggio.com.br'
  }
];

export function getMockCompanies(): RawCompany[] {
  return companies.map((company) => ({ ...company }));
}

export function getMockCompanyById(id: number): RawCompany | undefined {
  return companies.find((company) => company.id === id);
}

export { companies as mockCompanies };
