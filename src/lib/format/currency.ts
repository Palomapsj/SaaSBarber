const formatters = {
  whole: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }),
  cents: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }),
};

/** 4500 → "R$ 45" and 4550 → "R$ 45,50". The prototype hides ",00". */
export function formatCurrency(cents: number): string {
  const formatter = cents % 100 === 0 ? formatters.whole : formatters.cents;
  return formatter.format(cents / 100);
}
