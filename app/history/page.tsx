"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/history/calendar"
import { WorkoutList } from "@/components/history/workout-list"
import { WorkoutDetails } from "@/components/history/workout-details"
import { BottomNav } from "@/components/navigation/bottom-nav"
import type { Workout } from "@/types/workouts"

export default function HistoryPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load workouts from localStorage
  useEffect(() => {
    const savedWorkouts = JSON.parse(localStorage.getItem("workouts") || "[]")
    setWorkouts(savedWorkouts)
  }, [])

  const workoutDates = new Set(workouts.map((w) => w.date))

  const handleDeleteWorkout = (workoutId: string) => {
    const updatedWorkouts = workouts.filter((w) => w.id !== workoutId)
    setWorkouts(updatedWorkouts)
    localStorage.setItem("workouts", JSON.stringify(updatedWorkouts))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const savedWorkouts = JSON.parse(localStorage.getItem("workouts") || "[]")
    setWorkouts(savedWorkouts)
    setIsRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div
        className="p-4 space-y-6"
        onTouchStart={(e) => {
          const touch = e.touches[0]
          const startY = touch.pageY

          const handleTouchMove = (e: TouchEvent) => {
            const currentY = e.touches[0].pageY
            const diff = currentY - startY

            if (diff > 50 && window.scrollY === 0 && !isRefreshing) {
              handleRefresh()
            }
          }

          document.addEventListener("touchmove", handleTouchMove)
          document.addEventListener(
            "touchend",
            () => {
              document.removeEventListener("touchmove", handleTouchMove)
            },
            { once: true },
          )
        }}
      >
        {isRefreshing && (
          <div className="flex justify-center">
            <div className="pull-indicator" />
          </div>
        )}

        <Calendar
          currentDate={currentDate}
          workoutDates={workoutDates}
          onDateChange={setCurrentDate}
          onDateSelect={(date) => {
            const workout = workouts.find((w) => w.date === date)
            if (workout) setSelectedWorkout(workout)
          }}
        />

        <WorkoutList workouts={workouts} onWorkoutSelect={setSelectedWorkout} onWorkoutDelete={handleDeleteWorkout} />
      </div>

      <WorkoutDetails workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} />

      <BottomNav />
    </div>
  )
}

