import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateDaysLeft = (
  startDate: string,
  endDate: string
): number => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();

  if (now > end) {
    return -1; // Trip is in the past
  }

  const timeLeft = start - now;
  return Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
};

export const calculateTripDuration = (
  startDate: string,
  endDate: string
): number => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const duration = end - start;
  return Math.ceil(duration / (1000 * 60 * 60 * 24)) + 1;
};
