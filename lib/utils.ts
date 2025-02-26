import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertWeight(weight: number, toImperial: boolean): number {
  return toImperial ? weight * 2.20462 : weight
}

export function convertHeight(height: number, toImperial: boolean): { feet: number; inches: number } | number {
  if (toImperial) {
    const totalInches = height / 2.54
    return {
      feet: Math.floor(totalInches / 12),
      inches: Math.round(totalInches % 12),
    }
  }
  return height
}

