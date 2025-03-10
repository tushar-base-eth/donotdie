"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import type { Exercise, Set, UIWorkoutExercise } from "@/types/workouts";

interface WorkoutState {
  currentWorkout: {
    exercises: UIWorkoutExercise[];
    selectedExerciseIds: Exercise[];
    selectedExercise: UIWorkoutExercise | null;
  };
}

type Action =
  | { type: "SET_EXERCISES"; exercises: UIWorkoutExercise[] }
  | { type: "SET_SELECTED_EXERCISE_IDS"; ids: Exercise[] }
  | { type: "SET_SELECTED_EXERCISE"; exercise: UIWorkoutExercise | null }
  | { type: "UPDATE_EXERCISE_SETS"; exerciseIndex: number; sets: Set[] };

const initialState: WorkoutState = {
  currentWorkout: {
    exercises: [],
    selectedExerciseIds: [],
    selectedExercise: null,
  },
};

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

const WorkoutContext = createContext<{
  state: WorkoutState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState);
  return (
    <WorkoutContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}