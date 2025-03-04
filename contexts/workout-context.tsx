"use client";

import type React from "react";
import { createContext, useContext, useReducer, useEffect, useState } from "react";
import type { Set, UIWorkoutExercise } from "@/types/workouts";

// Define the structure of the workout state
interface WorkoutState {
  currentWorkout: {
    exercises: UIWorkoutExercise[];
    selectedExerciseIds: string[];
    selectedExercise: UIWorkoutExercise | null;
  };
}

// Define possible actions for the reducer
type WorkoutAction =
  | { type: "SET_EXERCISES"; exercises: UIWorkoutExercise[] }
  | { type: "SET_SELECTED_EXERCISE_IDS"; ids: string[] }
  | { type: "SET_SELECTED_EXERCISE"; exercise: UIWorkoutExercise | null }
  | { type: "UPDATE_EXERCISE_SETS"; exerciseIndex: number; sets: Set[] };

// Initial state with empty workout data
const initialState: WorkoutState = {
  currentWorkout: {
    exercises: [],
    selectedExerciseIds: [],
    selectedExercise: null,
  },
};

// Create the context for sharing state and dispatch
const WorkoutContext = createContext<{
  state: WorkoutState;
  dispatch: React.Dispatch<WorkoutAction>;
} | null>(null);

// Reducer to handle state updates
function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case "SET_EXERCISES":
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          exercises: action.exercises,
        },
      };
    case "SET_SELECTED_EXERCISE_IDS":
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          selectedExerciseIds: action.ids,
        },
      };
    case "SET_SELECTED_EXERCISE":
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          selectedExercise: action.exercise,
        },
      };
    case "UPDATE_EXERCISE_SETS": {
      const { exerciseIndex, sets } = action;
      if (exerciseIndex < 0 || exerciseIndex >= state.currentWorkout.exercises.length) {
        throw new Error(`Invalid exercise index: ${exerciseIndex}`);
      }
      const updatedExercises = [...state.currentWorkout.exercises];
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        sets,
      };
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          exercises: updatedExercises,
          selectedExercise:
            state.currentWorkout.selectedExercise?.instance_id === updatedExercises[exerciseIndex].instance_id
              ? updatedExercises[exerciseIndex]
              : state.currentWorkout.selectedExercise,
        },
      };
    }
    default:
      return state;
  }
}

// WorkoutProvider component to manage state and persistence
export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);
  const [isRestored, setIsRestored] = useState(false); // Flag to track restoration completion

  // Restore state from localStorage on component mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem("currentWorkout");
    if (savedWorkout) {
      try {
        const parsed = JSON.parse(savedWorkout);
        console.log("Restoring state:", parsed);
        dispatch({ type: "SET_EXERCISES", exercises: parsed.exercises });
        dispatch({ type: "SET_SELECTED_EXERCISE_IDS", ids: parsed.selectedExerciseIds });
      } catch (error) {
        console.error("Error parsing saved workout:", error);
      }
    } else {
      console.log("No saved workout found in localStorage");
    }
    setIsRestored(true); // Mark restoration as complete
  }, []);

  // Save state to localStorage only after restoration is complete
  useEffect(() => {
    if (isRestored) {
      console.log("Saving to localStorage:", state.currentWorkout);
      localStorage.setItem(
        "currentWorkout",
        JSON.stringify({
          exercises: state.currentWorkout.exercises,
          selectedExerciseIds: state.currentWorkout.selectedExerciseIds,
        })
      );
    }
  }, [state.currentWorkout.exercises, state.currentWorkout.selectedExerciseIds, isRestored]);

  return (
    <WorkoutContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkoutContext.Provider>
  );
}

// Hook to access workout context
export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}