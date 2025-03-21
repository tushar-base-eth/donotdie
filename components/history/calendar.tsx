"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHistoryContext } from "@/contexts/history-context";

export function Calendar({ workoutDates }: { workoutDates: Set<string> }) {
  const { selectedDate, setSelectedDate } = useHistoryContext();
  const [monthDate, setMonthDate] = useState(new Date());
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1
  ).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const previousMonthDays = Array.from(
    { length: firstDayOfMonth },
    (_, i) => null
  );
  const today = new Date().toISOString().split("T")[0];

  const handleMonthChange = (increment: number) => {
    const newDate = new Date(monthDate);
    newDate.setMonth(newDate.getMonth() + increment);
    if (selectedDate) {
      const selectedMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      );
      const newMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      if (
        selectedMonth.getFullYear() !== newMonth.getFullYear() ||
        selectedMonth.getMonth() !== newMonth.getMonth()
      ) {
        setSelectedDate(null);
      }
    }
    setMonthDate(newDate);
  };

  const isFutureDate = (date: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {monthDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMonthChange(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMonthChange(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground p-2"
            >
              {day}
            </div>
          ))}

          {previousMonthDays.map((_, index) => (
            <div key={`prev-${index}`} className="aspect-square p-2 bg-muted" />
          ))}

          {days.map((day) => {
            const date = `${monthDate.getFullYear()}-${String(
              monthDate.getMonth() + 1
            ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasWorkout = workoutDates.has(date);
            const isSelected =
              selectedDate && selectedDate.toISOString().split("T")[0] === date;
            const isToday = date === today;

            return (
              <div
                key={day}
                className={`
                  aspect-square p-2 relative ${
                    hasWorkout ? "cursor-pointer" : "cursor-default"
                  } flex items-center justify-center
                  ${isToday && !isSelected ? "bg-muted" : ""}
                `}
                onClick={() => {
                  if (!isFutureDate(date) && hasWorkout) {
                    setSelectedDate(
                      selectedDate?.toISOString().split("T")[0] === date
                        ? null
                        : new Date(date)
                    );
                  }
                }}
              >
                {/* Selection Highlight */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-highlight opacity-50" />
                  </div>
                )}

                {/* Date Text */}
                <span
                  className={`text-sm relative z-10 ${
                    hasWorkout && !isSelected
                      ? "font-medium text-highlight"
                      : ""
                  }`}
                >
                  {day}
                </span>

                {/* Workout Marking Dot */}
                {hasWorkout && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-highlight" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
