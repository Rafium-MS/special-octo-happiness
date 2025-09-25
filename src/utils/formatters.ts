const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(value);
}

export function formatPhone(value: string | null | undefined): string {
  const normalized = normalizeText(value);
  return normalized ?? 'Não informado';
}

export function formatEmail(value: string | null | undefined): string {
  const normalized = normalizeText(value);
  return normalized ?? 'Não informado';
}
