"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface CalendarProps {
  currentDate: Date
  workoutDates: Set<string>
  onDateChange: (date: Date) => void
  onDateSelect: (date: string) => void
}

export function Calendar({ currentDate, workoutDates, onDateChange, onDateSelect }: CalendarProps) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const previousMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => null)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDateChange(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDateChange(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {/* Previous month days */}
          {previousMonthDays.map((_, index) => (
            <div key={`prev-${index}`} className="aspect-square p-2 bg-muted" />
          ))}

          {/* Current month days */}
          {days.map((day) => {
            const date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const hasWorkout = workoutDates.has(date)
            return (
              <div
                key={day}
                className={`
                  aspect-square p-2 relative cursor-pointer
                  ${hasWorkout ? "bg-primary/10" : "bg-card"}
                `}
                onClick={() => hasWorkout && onDateSelect(date)}
              >
                <span className={`text-sm ${hasWorkout ? "font-medium" : ""}`}>{day}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

