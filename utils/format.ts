/**
 * Formats a number into the Indian numbering system string (lakhs, crores).
 * - It rounds the number to the nearest whole number and displays no decimal places.
 */
export const formatCurrency = (amount: number): string => {
  const roundedAmount = Math.round(amount);
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  return roundedAmount.toLocaleString('en-IN', options);
};