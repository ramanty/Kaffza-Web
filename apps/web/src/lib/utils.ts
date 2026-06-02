import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Omani Rial (OMR) with 3 decimal places.
 * Example: 15.5 → "15.500 ر.ع."
 */
export function formatCurrency(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('ar-OM', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(n) + ' ر.ع.';
}
