"use client";

import { useFormContext } from "react-hook-form"; // Add useFormContext
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function MeasurementsSettings() {
  const { watch } = useFormContext(); // Use context to watch unit_preference
  const unitPreference = watch("unit_preference");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        name="weight_kg"
        render={({ field }) => {
          const isImperial = unitPreference === "imperial";
          const displayValue = field.value && isImperial ? field.value * 2.20462 : field.value;
          return (
            <FormItem>
              <FormLabel className="flex items-center text-foreground/80">
                Weight ({isImperial ? "lbs" : "kg"})
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={displayValue ?? ""}
                  onChange={(e) => {
                    const inputValue = e.target.value ? Number(e.target.value) : null;
                    const valueInKg = inputValue && isImperial ? inputValue / 2.20462 : inputValue;
                    field.onChange(valueInKg);
                  }}
                  placeholder={`Enter weight`}
                  className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        name="height_cm"
        render={({ field }) => {
          const isImperial = unitPreference === "imperial";
          const displayValue = field.value && isImperial ? field.value / 2.54 : field.value;
          return (
            <FormItem>
              <FormLabel className="flex items-center text-foreground/80">
                Height ({isImperial ? "in" : "cm"})
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={displayValue ?? ""}
                  onChange={(e) => {
                    const inputValue = e.target.value ? Number(e.target.value) : null;
                    const valueInCm = inputValue && isImperial ? inputValue * 2.54 : inputValue;
                    field.onChange(valueInCm);
                  }}
                  placeholder={`Enter height`}
                  className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );
}