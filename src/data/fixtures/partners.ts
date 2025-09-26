import type { RawPartner } from '../../types/ipc';

const partners: RawPartner[] = [
  {
    id: 1,
    name: 'Águas do Sul Ltda',
    region: 'Sul',
    cities_json: JSON.stringify(['Porto Alegre', 'Curitiba', 'Florianópolis']),
    contact_name: 'Carlos Mendes',
    contact_phone: '(51) 99999-0001',
    contact_email: 'carlos@aguasdosul.com.br',
    status: 'ativo',
    receipts_status: 'enviado'
  },
  {
    id: 2,
    name: 'Distribuição Nordeste',
    region: 'Nordeste',
    cities_json: JSON.stringify(['Salvador', 'Recife', 'Fortaleza']),
    contact_name: 'Paula Oliveira',
    contact_phone: '(71) 99999-0002',
    contact_email: 'paula@distribnordeste.com.br',
    status: 'ativo',
    receipts_status: 'pendente'
  },
  {
    id: 3,
    name: 'SP Águas Express',
    region: 'Sudeste',
    cities_json: JSON.stringify(['São Paulo', 'Campinas', 'Santos']),
    contact_name: 'Roberto Lima',
    contact_phone: '(11) 99999-0003',
    contact_email: 'roberto@spaguas.com.br',
    status: 'ativo',
    receipts_status: 'enviado'
  }
];

export function getMockPartners(): RawPartner[] {
  return partners.map((partner) => ({ ...partner }));
}

export function getMockPartnerById(id: number): RawPartner | undefined {
  return partners.find((partner) => partner.id === id);
}

export { partners as mockPartners };
