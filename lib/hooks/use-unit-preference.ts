import { useUserProfile } from "@/contexts/profile-context";

export function useUnitPreference() {
  const { state } = useUserProfile();
  const { user } = state;
  const isImperial = user?.unit_preference === "imperial";

  const convertUnit = (type: "weight" | "height", value: number, toImperial: boolean) => {
    if (type === "weight") {
      return toImperial ? value * 2.20462 : value;
    } else if (type === "height") {
      return toImperial ? value / 2.54 : value;
    }
    return value;
  };

  const formatWeight = (weightInKg: number, decimals: number = 1): string => {
    const converted = isImperial ? convertUnit("weight", weightInKg, true) : weightInKg;
    const rounded = Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return `${rounded}${isImperial ? 'lb' : 'kg'}`;
  };

  const parseInputToKg = (value: string): number => {
    const numValue = parseFloat(value);
    return isImperial ? convertUnit("weight", numValue, false) : numValue;
  };

  const convertFromKg = (weightInKg: number): number => {
    return isImperial ? convertUnit("weight", weightInKg, true) : weightInKg;
  };

  const formatHeight = (heightInCm: number, decimals: number = 1): string => {
    const converted = isImperial ? convertUnit("height", heightInCm, true) : heightInCm;
    const rounded = Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return `${rounded}${isImperial ? 'in' : 'cm'}`;
  };

  const parseInputToCm = (value: string): number => {
    const numValue = parseFloat(value);
    return isImperial ? convertUnit("height", numValue, false) : numValue;
  };

  const convertFromCm = (heightInCm: number): number => {
    return isImperial ? convertUnit("height", heightInCm, true) : heightInCm;
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
    unitLabel: isImperial ? 'lb' : 'kg',
  };
}