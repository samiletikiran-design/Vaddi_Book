/**
 * Formats a number into the Indian numbering system string (lakhs, crores).
 * - Integers will have no decimal part (e.g., 100000 -> "1,00,000").
 * - Floats will have exactly 2 decimal places (e.g., 100.5 -> "100.50").
 */
export const formatCurrency = (amount: number): string => {
  const options: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
  };

  // For whole numbers, display no decimal places
  if (amount % 1 === 0) {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  } else {
    // For numbers with decimals, display exactly 2 decimal places
    options.minimumFractionDigits = 2;
  }

  return amount.toLocaleString('en-IN', options);
};
