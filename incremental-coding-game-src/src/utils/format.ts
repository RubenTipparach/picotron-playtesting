function compactLarge(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e15) return (n / 1e15).toFixed(2) + "Q";
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  return null as any; // shouldn't be called for < 1M
}

/** Format a number compactly — abbreviations up to Q, then scientific notation */
export function formatNumber(n: number, decimals: number = 0): string {
  const abs = Math.abs(n);
  if (abs >= 1e18) return n.toExponential(2);
  if (abs >= 1e6) return compactLarge(n);
  return decimals > 0
    ? n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : n.toLocaleString();
}

/** Format a dollar amount — abbreviations up to Q, then scientific notation */
export function formatMoney(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e18) return "$" + n.toExponential(2);
  if (abs >= 1e6) return "$" + compactLarge(n);
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format a price (always 2 decimals, abbreviations for large) */
export function formatPrice(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e18) return n.toExponential(2);
  if (abs >= 1e6) return compactLarge(n);
  return n.toFixed(2);
}
