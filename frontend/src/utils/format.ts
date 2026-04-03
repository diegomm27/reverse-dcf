function getCurrencySymbol(currency = 'USD'): string {
  try {
    return (
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .formatToParts(0)
        .find((part) => part.type === 'currency')?.value ?? `${currency} `
    );
  } catch {
    return '$';
  }
}

export function formatCurrency(value: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${getCurrencySymbol(currency)}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatLargeNumber(value: number, currency = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${symbol}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${symbol}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${symbol}${abs.toFixed(0)}`;
}

export function formatPercent(value: number, decimals = 1): string {
  if (!isFinite(value)) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatMultiplier(value: number): string {
  if (!isFinite(value)) return 'N/A';
  return `${value.toFixed(2)}x`;
}

export function formatGrowthRate(value: number): string {
  if (!isFinite(value)) return 'N/A';
  const pct = value * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}
