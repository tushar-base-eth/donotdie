"use client";

import type React from "react";
import { createContext, useContext, useReducer } from "react";
import type { Set, UIWorkoutExercise } from "@/types/workouts";

interface WorkoutState {
  currentWorkout: {
    exercises: UIWorkoutExercise[];
    selectedExerciseIds: string[];
    selectedExercise: UIWorkoutExercise | null;
  };
}

type WorkoutAction =
  | { type: "SET_EXERCISES"; exercises: UIWorkoutExercise[] }
  | { type: "SET_SELECTED_EXERCISE_IDS"; ids: string[] }
  | { type: "SET_SELECTED_EXERCISE"; exercise: UIWorkoutExercise | null }
  | { type: "UPDATE_EXERCISE_SETS"; exerciseIndex: number; sets: Set[] };

const initialState: WorkoutState = {
  currentWorkout: {
    exercises: [],
    selectedExerciseIds: [],
    selectedExercise: null,
  },
};

const WorkoutContext = createContext<{
  state: WorkoutState;
  dispatch: React.Dispatch<WorkoutAction>;
} | null>(null);

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

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);
  return <WorkoutContext.Provider value={{ state, dispatch }}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}