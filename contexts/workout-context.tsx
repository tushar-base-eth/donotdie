"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import type { ExtendedExercise, Set, UIWorkoutExercise } from "@/types/workouts";

// Define the shape of the workout state
interface WorkoutState {
  currentWorkout: {
    exercises: UIWorkoutExercise[];
    selectedExerciseIds: ExtendedExercise[]; // Updated to ExtendedExercise[]
    selectedExercise: UIWorkoutExercise | null;
  };
}

// Define action types for the reducer
type Action =
  | { type: "SET_EXERCISES"; exercises: UIWorkoutExercise[] }
  | { type: "SET_SELECTED_EXERCISE_IDS"; ids: ExtendedExercise[] } // Updated to ExtendedExercise[]
  | { type: "SET_SELECTED_EXERCISE"; exercise: UIWorkoutExercise | null }
  | { type: "UPDATE_EXERCISE_SETS"; exerciseIndex: number; sets: Set[] };

// Initial state for the workout context
const initialState: WorkoutState = {
  currentWorkout: {
    exercises: [],
    selectedExerciseIds: [],
    selectedExercise: null,
  },
};

// Reducer to handle state updates
function workoutReducer(state: WorkoutState, action: Action): WorkoutState {
  switch (action.type) {
    case "SET_EXERCISES":
      return {
        ...state,
        currentWorkout: { ...state.currentWorkout, exercises: action.exercises },
      };
    case "SET_SELECTED_EXERCISE_IDS":
      return {
        ...state,
        currentWorkout: { ...state.currentWorkout, selectedExerciseIds: action.ids },
      };
    case "SET_SELECTED_EXERCISE":
      return {
        ...state,
        currentWorkout: { ...state.currentWorkout, selectedExercise: action.exercise },
      };
    case "UPDATE_EXERCISE_SETS":
      const updatedExercises = [...state.currentWorkout.exercises];
      updatedExercises[action.exerciseIndex] = {
        ...updatedExercises[action.exerciseIndex],
        sets: action.sets,
      };
      return {
        ...state,
        currentWorkout: { ...state.currentWorkout, exercises: updatedExercises },
      };
    default:
      return state;
  }
}

// Create the context
const WorkoutContext = createContext<{
  state: WorkoutState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Provider component to wrap the app or relevant components
export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);
  return (
    <WorkoutContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkoutContext.Provider>
  );
}

// Hook to use the workout context
export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}