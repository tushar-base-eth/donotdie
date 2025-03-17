"use client";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export function ProfileSettings() {
  return (
    <>
      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-foreground/80">Name</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Enter your name"
                className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex flex-wrap gap-6">
        {/* Gender Field */}
        <FormField
          name="gender"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center text-foreground/80">Gender</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "null" ? null : value as "male" | "female" | "other")
                }
                value={field.value ?? "null"}
                key={field.value}
              >
                <FormControl>
                  <SelectTrigger className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="null">Not specified</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date of Birth Field */}
        <FormField
          name="date_of_birth"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center text-foreground/80">
                <Calendar className="h-4 w-4 mr-1 inline" />
                Date of Birth
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value ? field.value.toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    field.onChange(e.target.value ? new Date(e.target.value) : null)
                  }
                  className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        name="unit_preference"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-foreground/80">Unit Preference</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              key={field.value}
            >
              <FormControl>
                <SelectTrigger className="rounded-xl focus:ring-2 focus:ring-ring focus:border-ring w-full mt-1.5">
                  <SelectValue placeholder="Select unit preference" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="rounded-xl">
                <SelectItem value="metric">Metric (kg/cm)</SelectItem>
                <SelectItem value="imperial">Imperial (lb/in)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">
              This will affect how your measurements are displayed
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}