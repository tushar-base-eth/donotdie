import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function convertWeight(weight: number, toImperial: boolean): number {
  return toImperial ? weight * 2.20462 : weight;
}

export function convertHeightToInches(heightCm: number): number {
  return heightCm / 2.54;
}

export function convertInchesToCm(heightInches: number): number {
  return heightInches * 2.54;
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatUtcToLocalDate(utcDateString: string): string {
  const utcDate = parseISO(utcDateString);
  return format(utcDate, "yyyy-MM-dd");
}

export function formatUtcToLocalTime(utcDateString: string): string {
  const utcDate = parseISO(utcDateString);
  return format(utcDate, "hh:mm a");
}