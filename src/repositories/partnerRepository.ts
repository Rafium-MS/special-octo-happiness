import { getMockPartners } from '../data/fixtures';
import { adaptPartner, createEmptyEntities, normalizeEntities } from '../models/mappers';
import type { NormalizedEntities, Partner } from '../types/entities';
import type { RawPartner, WindowApi } from '../types/ipc';
import { fetchWithFallback } from './utils';

type Dependencies = {
  api?: WindowApi | null;
  fallback?: RawPartner[];
};

export type PartnerRepository = {
  list: () => Promise<NormalizedEntities<Partner>>;
  createEmpty: () => NormalizedEntities<Partner>;
};

export function createPartnerRepository({ api = window.api, fallback = getMockPartners() }: Dependencies = {}): PartnerRepository {
  return {
    async list() {
      const raw = await fetchWithFallback(fallback, (resolvedApi) => resolvedApi.partners.list(), { api });
      const partners = raw.map(adaptPartner);
      return normalizeEntities(partners);
    },
    createEmpty() {
      return createEmptyEntities<Partner>();
    },
  };
}

export const partnerRepository = createPartnerRepository();
