export const formatAmount = (amount: number) => {
  const absAmount = Math.abs(amount);
  // Remove decimal if it's .00
  return absAmount % 1 === 0 ? absAmount.toString() : absAmount.toFixed(2);
};