import { describe, expect, it } from 'vitest';
import { formatCurrency, formatEmail, formatPhone } from '../formatters';

const normalizeCurrency = (value: string) => value.replace(/\s+/g, ' ').trim();

describe('formatCurrency', () => {
  it('formats positive numbers using BRL locale', () => {
    const formatted = formatCurrency(1234.5);
    expect(normalizeCurrency(formatted)).toContain('R$');
    expect(normalizeCurrency(formatted)).toContain('1.234,50');
  });

  it('formats negative numbers preserving the sign', () => {
    const formatted = formatCurrency(-987.65);
    expect(normalizeCurrency(formatted)).toContain('R$');
    expect(normalizeCurrency(formatted)).toContain('987,65');
    expect(formatted.trim().startsWith('-')).toBe(true);
  });

  it('falls back to zero when value is null, undefined or NaN', () => {
    expect(formatCurrency(null)).toBe(formatCurrency(0));
    expect(formatCurrency(undefined)).toBe(formatCurrency(0));
    expect(formatCurrency(Number.NaN)).toBe(formatCurrency(0));
  });
});

describe('formatPhone', () => {
  it('returns normalized phone when provided', () => {
    expect(formatPhone('  (11) 99999-9999  ')).toBe('(11) 99999-9999');
  });

  it('returns fallback when value is nullish or empty', () => {
    expect(formatPhone(null)).toBe('Não informado');
    expect(formatPhone(undefined)).toBe('Não informado');
    expect(formatPhone('   ')).toBe('Não informado');
  });
});

describe('formatEmail', () => {
  it('returns normalized email when provided', () => {
    expect(formatEmail(' user@example.com ')).toBe('user@example.com');
  });

  it('returns fallback when value is nullish or empty', () => {
    expect(formatEmail(null)).toBe('Não informado');
    expect(formatEmail(undefined)).toBe('Não informado');
    expect(formatEmail('')).toBe('Não informado');
  });
});
