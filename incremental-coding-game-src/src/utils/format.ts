/** Format a number compactly — scientific notation above 1M, locale string below */
export function formatNumber(n: number, decimals: number = 0): string {
  if (Math.abs(n) >= 1e6) return n.toExponential(2);
  return decimals > 0
    ? n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : n.toLocaleString();
}

/** Format a dollar amount — scientific notation above 1M, $X,XXX.XX below */
export function formatMoney(n: number): string {
  if (Math.abs(n) >= 1e6) return "$" + n.toExponential(2);
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format a price (always 2 decimals, scientific above 1M) */
export function formatPrice(n: number): string {
  if (Math.abs(n) >= 1e6) return n.toExponential(2);
  return n.toFixed(2);
}
