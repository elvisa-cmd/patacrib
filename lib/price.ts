/** Formats a price in Kenyan Shillings.
 *  ≥1M  → "KSh 1.2M"
 *  ≥100K → "KSh 55K"
 *  else  → "KSh 28,000"
 */
export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `KSh ${(price / 1_000_000).toFixed(1)}M`
  }
  if (price >= 100_000) {
    return `KSh ${Math.round(price / 1_000)}K`
  }
  return `KSh ${price.toLocaleString('en-KE')}`
}
