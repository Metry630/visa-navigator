/**
 * Today's date as YYYY-MM-DD in the local timezone. Not `toISOString()`: that is UTC, so an
 * evening in Jakarta or Singapore stamps yesterday's date on a page fetched today.
 */
export function today(): string {
  return new Date().toLocaleDateString("en-CA");
}
