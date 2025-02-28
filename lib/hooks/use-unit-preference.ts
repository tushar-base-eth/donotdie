import { useAuth } from "@/contexts/auth-context";
import { convertWeight } from "@/lib/utils";

export function useUnitPreference() {
  const { state } = useAuth();
  const { user } = state;
  const isImperial = user?.unitPreference === "imperial";

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

  return {
    isImperial,
    formatWeight,
    parseInputToKg,
    convertFromKg,
    unitLabel: isImperial ? 'lb' : 'kg'
  };
} 