export function money(cents: number): string {
  const dollars = cents / 100;
  // Whole-dollar amounts show as "$50"; anything else always shows exactly
  // two decimals ("$12.30", never the truncated "$12.3" that omitting
  // maximumFractionDigits used to produce) — toLocaleString still adds
  // thousands separators either way.
  return (
    "$" +
    dollars.toLocaleString(undefined, {
      minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
