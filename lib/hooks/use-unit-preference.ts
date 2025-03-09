import { useAuth } from "@/contexts/auth-context";
import type { Profile } from "@/types/workouts"; // Import updated Profile type

// Utility hook to handle unit preferences and conversions
export function useUnitPreference() {
  const { state } = useAuth();
  const { user } = state;
  const isImperial = user?.unit_preference === "imperial";

  // Weight conversion functions
  const convertWeight = (weight: number, toImperial: boolean) => {
    return toImperial ? weight * 2.20462 : weight;
  };

  const formatWeight = (weightInKg: number, decimals: number = 1): string => {
    const converted = isImperial ? convertWeight(weightInKg, true) : weightInKg;
    const rounded = Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return `${rounded}${isImperial ? 'lb' : 'kg'}`;
  };

  const parseInputToKg = (value: string): number => {
    const numValue = parseFloat(value);
    return isImperial ? numValue / 2.20462 : numValue;
  };

  const convertFromKg = (weightInKg: number): number => {
    return isImperial ? convertWeight(weightInKg, true) : weightInKg;
  };

  // Height conversion functions
  const convertHeight = (height: number, toImperial: boolean) => {
    return toImperial ? height / 2.54 : height;
  };

  const formatHeight = (heightInCm: number, decimals: number = 1): string => {
    const converted = isImperial ? convertHeight(heightInCm, true) : heightInCm;
    const rounded = Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return `${rounded}${isImperial ? 'in' : 'cm'}`;
  };

  const parseInputToCm = (value: string): number => {
    const numValue = parseFloat(value);
    return isImperial ? numValue * 2.54 : numValue;
  };

  const convertFromCm = (heightInCm: number): number => {
    return isImperial ? convertHeight(heightInCm, true) : heightInCm;
  };

  return {
    isImperial,
    formatWeight,
    parseInputToKg,
    convertFromKg,
    formatHeight,
    parseInputToCm,
    convertFromCm,
    weightUnit: isImperial ? 'lb' : 'kg',
    heightUnit: isImperial ? 'in' : 'cm',
    unitLabel: isImperial ? 'lb' : 'kg', // Added for convenience in UI components
  };
}