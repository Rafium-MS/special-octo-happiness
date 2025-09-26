import type { WindowApi } from '../types/ipc';

type Loader<T> = (api: WindowApi) => Promise<T>;

type FetchDependencies = {
  api?: WindowApi | null;
  onFallback?: (error: unknown) => void;
};

export async function fetchWithFallback<T>(
  fallback: T,
  loader: Loader<T>,
  { api = window.api, onFallback }: FetchDependencies = {}
): Promise<T> {
  if (!api) return fallback;
  try {
    const result = await loader(api);
    if (result === null || result === undefined) {
      onFallback?.(null);
      return fallback;
    }
    return result;
  } catch (error) {
    onFallback?.(error);
    console.warn('[repository] Falling back to mock data after IPC failure', error);
    return fallback;
  }
}
