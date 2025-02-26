"use client"

import type React from "react"

import { createContext, useContext, useReducer, useEffect } from "react"
import type { WorkoutExercise } from "@/types/exercises"
import type { Workout } from "@/types/workouts"

// Define the state shape
interface WorkoutState {
  currentWorkout: {
    exercises: WorkoutExercise[]
    selectedExerciseIds: string[]
    selectedExercise: WorkoutExercise | null
  }
  history: {
    workouts: Workout[]
    selectedWorkout: Workout | null
  }
}

// Define action types
type WorkoutAction =
  | { type: "SET_EXERCISES"; exercises: WorkoutExercise[] }
  | { type: "SET_SELECTED_EXERCISE_IDS"; ids: string[] }
  | { type: "SET_SELECTED_EXERCISE"; exercise: WorkoutExercise | null }
  | { type: "UPDATE_EXERCISE_SETS"; exerciseIndex: number; sets: Set[] }
  | { type: "SAVE_WORKOUT"; workout: Workout }
  | { type: "DELETE_WORKOUT"; workoutId: string }
  | { type: "SET_SELECTED_WORKOUT"; workout: Workout | null }
  | { type: "LOAD_WORKOUTS"; workouts: Workout[] }

// Initial state
const initialState: WorkoutState = {
  currentWorkout: {
    exercises: [],
    selectedExerciseIds: [],
    selectedExercise: null,
  },
  history: {
    workouts: [],
    selectedWorkout: null,
  },
}

// Create context
const WorkoutContext = createContext<{
  state: WorkoutState
  dispatch: React.Dispatch<WorkoutAction>
} | null>(null)

// Reducer function
function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case "SET_EXERCISES":
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          exercises: action.exercises,
        },
      }
    case "SET_SELECTED_EXERCISE_IDS":
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          selectedExerciseIds: action.ids,
        },
      }
    case "SET_SELECTED_EXERCISE":
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          selectedExercise: action.exercise,
        },
      }
    case "UPDATE_EXERCISE_SETS":
      const updatedExercises = [...state.currentWorkout.exercises]
      updatedExercises[action.exerciseIndex] = {
        ...updatedExercises[action.exerciseIndex],
        sets: action.sets,
      }
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          exercises: updatedExercises,
          selectedExercise:
            state.currentWorkout.selectedExercise?.exercise.id === updatedExercises[action.exerciseIndex].exercise.id
              ? updatedExercises[action.exerciseIndex]
              : state.currentWorkout.selectedExercise,
        },
      }
    case "SAVE_WORKOUT":
      return {
        ...state,
        currentWorkout: {
          exercises: [],
          selectedExerciseIds: [],
          selectedExercise: null,
        },
        history: {
          ...state.history,
          workouts: [action.workout, ...state.history.workouts],
        },
      }
    case "DELETE_WORKOUT":
      return {
        ...state,
        history: {
          ...state.history,
          workouts: state.history.workouts.filter((w) => w.id !== action.workoutId),
          selectedWorkout:
            state.history.selectedWorkout?.id === action.workoutId ? null : state.history.selectedWorkout,
        },
      }
    case "SET_SELECTED_WORKOUT":
      return {
        ...state,
        history: {
          ...state.history,
          selectedWorkout: action.workout,
        },
      }
    case "LOAD_WORKOUTS":
      return {
        ...state,
        history: {
          ...state.history,
          workouts: action.workouts,
        },
      }
    default:
      return state
  }
}

// Provider component
export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState)

  // Load workouts from localStorage on mount
  useEffect(() => {
    const savedWorkouts = JSON.parse(localStorage.getItem("workouts") || "[]")
    dispatch({ type: "LOAD_WORKOUTS", workouts: savedWorkouts })
  }, [])

  // Save workouts to localStorage when they change
  useEffect(() => {
    localStorage.setItem("workouts", JSON.stringify(state.history.workouts))
  }, [state.history.workouts])

  return <WorkoutContext.Provider value={{ state, dispatch }}>{children}</WorkoutContext.Provider>
}

// Custom hook to use the workout context
export function useWorkout() {
  const context = useContext(WorkoutContext)
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider")
  }
  return context
}

