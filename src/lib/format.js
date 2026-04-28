const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtNumber = (value) => numberFormatter.format(Number(value || 0));

export const fmtCurrency = (value) => currencyFormatter.format(Number(value || 0));

export const fmtSigned = (value) => {
  const n = Number(value || 0);
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  return `${sign}${currencyFormatter.format(Math.abs(n))}`;
};
