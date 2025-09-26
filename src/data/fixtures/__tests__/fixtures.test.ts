import { describe, expect, it } from 'vitest';
import {
  getMockCompanies,
  getMockCompanyById,
  getMockKanban,
  getMockPartners,
  getMockPartnerById,
  mockCompanies,
  mockKanban,
  mockPartners,
} from '../index';

describe('data fixtures', () => {
  it('returns copies of mock companies', () => {
    const first = getMockCompanies();
    const second = getMockCompanies();

    expect(first).not.toBe(second);
    expect(first).toEqual(mockCompanies);
    first[0].name = 'Changed';
    expect(second[0].name).toBe(mockCompanies[0].name);
  });

  it('finds companies by id', () => {
    const company = getMockCompanyById(1);
    expect(company?.name).toBe(mockCompanies[0].name);
    expect(getMockCompanyById(999)).toBeUndefined();
  });

  it('returns copies of mock partners', () => {
    const partners = getMockPartners();
    expect(partners).toEqual(mockPartners);
    partners[0].name = 'Altered';
    expect(mockPartners[0].name).not.toBe('Altered');
  });

  it('finds partners by id', () => {
    expect(getMockPartnerById(2)?.name).toBe(mockPartners[1].name);
    expect(getMockPartnerById(999)).toBeUndefined();
  });

  it('returns copies of mock kanban items', () => {
    const items = getMockKanban();
    expect(items).toEqual(mockKanban);
    items[0].company = 'Modified';
    expect(mockKanban[0].company).not.toBe('Modified');
  });
});
