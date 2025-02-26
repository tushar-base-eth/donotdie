import type { Exercise } from "@/types/exercises"

export const exerciseGroups: Record<string, Exercise[]> = {
  "Upper Body": [
    {
      id: "barbell-bench-press",
      name: "Barbell Bench Press",
      primary_muscle_group: "Chest",
      secondary_muscle_group: "Triceps",
    },
    {
      id: "bench-press",
      name: "Bench Press",
      primary_muscle_group: "Chest",
      secondary_muscle_group: "Triceps",
    },
    {
      id: "bent-over-row",
      name: "Bent-Over Row",
      primary_muscle_group: "Back",
      secondary_muscle_group: "Biceps",
    },
    {
      id: "shoulder-press",
      name: "Shoulder Press",
      primary_muscle_group: "Shoulders",
      secondary_muscle_group: "Triceps",
    },
    {
      id: "pull-up",
      name: "Pull-up",
      primary_muscle_group: "Back",
      secondary_muscle_group: "Biceps",
    },
  ],
  "Lower Body": [
    {
      id: "squats",
      name: "Squats",
      primary_muscle_group: "Legs",
      secondary_muscle_group: "Glutes",
    },
    {
      id: "deadlifts",
      name: "Deadlifts",
      primary_muscle_group: "Back",
      secondary_muscle_group: "Hamstrings",
    },
    {
      id: "calf-raises",
      name: "Calf Raises",
      primary_muscle_group: "Calves",
    },
    {
      id: "lunges",
      name: "Lunges",
      primary_muscle_group: "Legs",
      secondary_muscle_group: "Glutes",
    },
    {
      id: "leg-press",
      name: "Leg Press",
      primary_muscle_group: "Legs",
      secondary_muscle_group: "Glutes",
    },
  ],
  Arms: [
    {
      id: "bicep-curls",
      name: "Bicep Curls",
      primary_muscle_group: "Biceps",
    },
    {
      id: "tricep-extensions",
      name: "Tricep Extensions",
      primary_muscle_group: "Triceps",
    },
    {
      id: "hammer-curls",
      name: "Hammer Curls",
      primary_muscle_group: "Biceps",
    },
    {
      id: "skull-crushers",
      name: "Skull Crushers",
      primary_muscle_group: "Triceps",
    },
  ],
}

