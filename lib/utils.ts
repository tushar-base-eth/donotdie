import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, subDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameWeek, isSameMonth } from "date-fns";
import type { UIDailyVolume } from "@/types/workouts";

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

export function formatVolumeData(data: UIDailyVolume[], timeRange: "7days" | "8weeks" | "12months"): UIDailyVolume[] {
  const today = new Date();
  let formattedData: UIDailyVolume[] = [];

  if (timeRange === "7days") {
    const days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    formattedData = days.map((day) => {
      const dayVolume = data
        .filter((d) => d.date === format(day, "yyyy-MM-dd"))
        .reduce((sum, d) => sum + d.volume, 0);
      return { date: format(day, "MMM d"), volume: dayVolume };
    });
  } else if (timeRange === "8weeks") {
    const weeks = eachWeekOfInterval({ start: subDays(today, 55), end: today }, { weekStartsOn: 1 });
    formattedData = weeks.map((weekStart) => {
      const weekVolume = data
        .filter((d) => isSameWeek(parseISO(d.date), weekStart, { weekStartsOn: 1 }))
        .reduce((sum, d) => sum + d.volume, 0);
      return { date: format(weekStart, "MMM d"), volume: weekVolume };
    });
  } else {
    const months = eachMonthOfInterval({ start: subDays(today, 364), end: today });
    formattedData = months.map((monthStart) => {
      const monthVolume = data
        .filter((d) => isSameMonth(parseISO(d.date), monthStart))
        .reduce((sum, d) => sum + d.volume, 0);
      return { date: format(monthStart, "MMM yyyy"), volume: monthVolume };
    });
  }

  return formattedData;
}