"use client";

import { createContext, useState, useContext } from "react";
import type { UIExtendedWorkout } from "@/types/workouts";

interface HistoryContextType {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  selectedWorkout: UIExtendedWorkout | null;
  setSelectedWorkout: (workout: UIExtendedWorkout | null) => void;
  pendingDeletions: string[];
  addPendingDeletion: (workoutId: string) => void;
  removePendingDeletion: (workoutId: string) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<UIExtendedWorkout | null>(null);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);

  const addPendingDeletion = (workoutId: string) => {
    setPendingDeletions((prev) => [...prev, workoutId]);
  };

  const removePendingDeletion = (workoutId: string) => {
    setPendingDeletions((prev) => prev.filter((id) => id !== workoutId));
  };

  return (
    <HistoryContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        selectedWorkout,
        setSelectedWorkout,
        pendingDeletions,
        addPendingDeletion,
        removePendingDeletion,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistoryContext = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistoryContext must be used within a HistoryProvider");
  }
  return context;
};