import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns"; // Added import for date handling

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function convertWeight(weight: number, toImperial: boolean): number {
  return toImperial ? weight * 2.20462 : weight;
}

export function convertHeight(
  height: number,
  toImperial: boolean
): { feet: number; inches: number } | number {
  if (toImperial) {
    const totalInches = height / 2.54;
    return {
      feet: Math.floor(totalInches / 12),
      inches: Math.round(totalInches % 12),
    };
  }
  return height;
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

/**
 * Converts a UTC ISO string from Supabase to a local date string.
 * @param utcDateString - UTC ISO string (e.g., "2023-10-15T12:00:00Z")
 * @returns Local date string (e.g., "2023-10-15" in user's local time zone)
 */
export function formatUtcToLocalDate(utcDateString: string): string {
  const utcDate = parseISO(utcDateString);
  return format(utcDate, "yyyy-MM-dd");
}

/**
 * Converts a UTC ISO string from Supabase to a local time string.
 * @param utcDateString - UTC ISO string (e.g., "2023-10-15T12:00:00Z")
 * @returns Local time string (e.g., "12:00 PM" in user's local time zone)
 */
export function formatUtcToLocalTime(utcDateString: string): string {
  const utcDate = parseISO(utcDateString);
  return format(utcDate, "hh:mm a");
}