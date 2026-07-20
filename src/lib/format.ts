export function money(cents: number): string {
  return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 });
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
