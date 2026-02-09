const rawRate = Number(import.meta.env.VITE_USD_TO_EUR || '0');
const usdToEurRate = Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 1;

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

const eurFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2
});

export const formatUsd = (amount: number) => usdFormatter.format(amount);

export const formatEur = (amount: number) => eurFormatter.format(amount);

export const formatUsdWithEur = (amount: number) => {
  const eur = amount * usdToEurRate;
  return `${formatUsd(amount)} · ${formatEur(eur)}`;
};
