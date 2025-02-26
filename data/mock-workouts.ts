import type { Workout } from "@/types/workouts"

export const initialWorkouts: Workout[] = [
  {
    id: "1",
    date: "2025-02-23",
    time: "10:33 PM",
    duration: 45,
    totalVolume: 3240,
    exercises: [
      {
        name: "Barbell Bench Press",
        sets: [
          { reps: 12, weight: 60 },
          { reps: 10, weight: 65 },
          { reps: 8, weight: 70 },
        ],
      },
      {
        name: "Pull-ups",
        sets: [
          { reps: 10, weight: 0 },
          { reps: 8, weight: 0 },
          { reps: 6, weight: 0 },
        ],
      },
    ],
  },
  {
    id: "2",
    date: "2025-02-22",
    time: "8:15 AM",
    duration: 60,
    totalVolume: 4150,
    exercises: [
      {
        name: "Squats",
        sets: [
          { reps: 10, weight: 100 },
          { reps: 8, weight: 110 },
          { reps: 6, weight: 120 },
        ],
      },
      {
        name: "Deadlifts",
        sets: [
          { reps: 8, weight: 130 },
          { reps: 6, weight: 140 },
          { reps: 4, weight: 150 },
        ],
      },
    ],
  },
  {
    id: "3",
    date: "2025-02-20",
    time: "4:45 PM",
    duration: 50,
    totalVolume: 2800,
    exercises: [
      {
        name: "Shoulder Press",
        sets: [
          { reps: 12, weight: 40 },
          { reps: 10, weight: 45 },
          { reps: 8, weight: 50 },
        ],
      },
      {
        name: "Bent-Over Row",
        sets: [
          { reps: 12, weight: 60 },
          { reps: 10, weight: 65 },
          { reps: 8, weight: 70 },
        ],
      },
    ],
  },
]

