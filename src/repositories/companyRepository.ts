import { getMockCompanies } from '../data/fixtures';
import { adaptCompany, createEmptyEntities, normalizeEntities } from '../models/mappers';
import type { Company, NormalizedEntities } from '../types/entities';
import type { RawCompany, WindowApi } from '../types/ipc';
import { fetchWithFallback } from './utils';

type Dependencies = {
  api?: WindowApi | null;
  fallback?: RawCompany[];
};

export type CompanyRepository = {
  list: () => Promise<NormalizedEntities<Company>>;
  createEmpty: () => NormalizedEntities<Company>;
};

export function createCompanyRepository({ api = window.api, fallback = getMockCompanies() }: Dependencies = {}): CompanyRepository {
  return {
    async list() {
      const raw = await fetchWithFallback(fallback, (resolvedApi) => resolvedApi.companies.list(), { api });
      const companies = raw.map(adaptCompany);
      return normalizeEntities(companies);
    },
    createEmpty() {
      return createEmptyEntities<Company>();
    },
  };
}

export const companyRepository = createCompanyRepository();
