import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const newId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const pctChange = (prev, curr) => {
  const p = parseFloat(prev), c = parseFloat(curr);
  if (isNaN(p) || isNaN(c) || p === 0) return null;
  return Math.round(((c - p) / p) * 100);
};
