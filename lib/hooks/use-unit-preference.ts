import { useAuth } from "@/contexts/auth-context";
import { convertWeight } from "@/lib/utils";

// Utility hook to handle unit preferences and conversions
export function useUnitPreference() {
  const { state } = useAuth();
  const { user } = state;
  const isImperial = user?.unit_preference === "imperial"; // Determine unit system based on user preference

  // Format weight based on unit preference
  const formatWeight = (weightInKg: number, decimals: number = 1): string => {
    const converted = isImperial ? convertWeight(weightInKg, true) : weightInKg;
    const rounded = Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return `${rounded}${isImperial ? 'lb' : 'kg'}`;
  };

  // Parse user input to kg (e.g., for form submissions)
  const parseInputToKg = (value: string): number => {
    const numValue = parseFloat(value);
    return isImperial ? numValue / 2.20462 : numValue;
  };

  // Convert weight from kg to user’s preferred unit
  const convertFromKg = (weightInKg: number): number => {
    return isImperial ? convertWeight(weightInKg, true) : weightInKg;
  };

  return {
    isImperial,
    formatWeight,
    parseInputToKg,
    convertFromKg,
    unitLabel: isImperial ? 'lb' : 'kg'
  };
}