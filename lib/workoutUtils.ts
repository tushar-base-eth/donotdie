import { supabase } from '@/lib/supabase/browser';
import type { UIExtendedWorkout, UIWorkoutExercise } from "@/types/workouts";
import { parseISO, format, isValid } from "date-fns";

export async function fetchAllWorkouts(userId: string): Promise<UIExtendedWorkout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select(`
      id, user_id, workout_date, created_at,
      workout_exercises (
        id, workout_id, exercise_type, predefined_exercise_id, user_exercise_id, order, effort_level, created_at,
        exercises (id, name, primary_muscle_group, secondary_muscle_group, category, uses_reps, uses_weight, uses_duration, uses_distance, is_deleted),
        user_exercises (id, name, primary_muscle_group, secondary_muscle_group, category, uses_reps, uses_weight, uses_duration, uses_distance),
        sets (id, workout_exercise_id, set_number, reps, weight_kg, duration_seconds, distance_meters, created_at)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("order", { ascending: true, foreignTable: "workout_exercises" })
    .order("set_number", { ascending: true, foreignTable: "workout_exercises.sets" });

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message);
  }

  const formattedWorkouts: UIExtendedWorkout[] = (data || [])
    .filter((rawWorkout) => rawWorkout.created_at !== null && rawWorkout.workout_date !== null)
    .map((rawWorkout) => {
      let utcDate: Date;
      if (rawWorkout.workout_date && typeof rawWorkout.workout_date === "string") {
        utcDate = parseISO(rawWorkout.workout_date);
        if (!isValid(utcDate)) {
          console.error(`Invalid workout_date for workout ${rawWorkout.id}: ${rawWorkout.workout_date}`);
          utcDate = parseISO(rawWorkout.created_at as string) || new Date();
        }
      } else {
        console.warn(`Missing workout_date for workout ${rawWorkout.id}, using created_at`);
        utcDate = parseISO(rawWorkout.created_at as string) || new Date();
      }
      const localDate = format(utcDate, "yyyy-MM-dd");
      const localTime = format(utcDate, "hh:mm a");

      const exercises: UIWorkoutExercise[] = rawWorkout.workout_exercises.map((we: any) => {
        const exerciseData = we.exercise_type === "predefined" ? we.exercises : we.user_exercises;
        return {
          id: we.id,
          workout_id: we.workout_id,
          exercise_type: we.exercise_type,
          predefined_exercise_id: we.predefined_exercise_id,
          user_exercise_id: we.user_exercise_id || null,
          order: we.order,
          effort_level: we.effort_level || null,
          created_at: we.created_at,
          instance_id: `${we.id}-${we.order}`,
          exercise: {
            id: exerciseData?.id ?? "",
            name: exerciseData?.name ?? "Unknown",
            primary_muscle_group: exerciseData?.primary_muscle_group ?? "other",
            secondary_muscle_group: exerciseData?.secondary_muscle_group ?? null,
            category: exerciseData?.category ?? "other",
            uses_reps: exerciseData?.uses_reps ?? false,
            uses_weight: exerciseData?.uses_weight ?? false,
            uses_duration: exerciseData?.uses_duration ?? false,
            uses_distance: exerciseData?.uses_distance ?? false,
            is_deleted: exerciseData?.is_deleted ?? false,
            source: we.exercise_type,
          },
          sets: we.sets ?? [],
        };
      });

      const totalVolume = exercises.reduce((sum, ex) => {
        const sets = Array.isArray(ex.sets) ? ex.sets : [];
        return sum + sets.reduce((setSum, set) => {
          const reps = Number(set.reps) || 0;
          const weight_kg = Number(set.weight_kg) || 0;
          return setSum + (reps * weight_kg);
        }, 0);
      }, 0);

      const totalDistance = exercises.reduce((sum, ex) => {
        const sets = Array.isArray(ex.sets) ? ex.sets : [];
        return sum + sets.reduce((setSum, set) => {
          const distance = Number(set.distance_meters) || 0;
          return setSum + distance;
        }, 0);
      }, 0);

      const totalDuration = exercises.reduce((sum, ex) => {
        const sets = Array.isArray(ex.sets) ? ex.sets : [];
        return sum + sets.reduce((setSum, set) => {
          const duration = Number(set.duration_seconds) || 0;
          return setSum + duration;
        }, 0);
      }, 0);

      const hasWeight = exercises.some((ex) =>
        ex.sets.some((set) => set.weight_kg != null && set.weight_kg > 0)
      );

      const hasDistance = exercises.some((ex) =>
        ex.sets.some((set) => set.distance_meters != null && set.distance_meters > 0)
      );

      const hasDuration = exercises.some((ex) =>
        ex.sets.some((set) => set.duration_seconds != null && set.duration_seconds > 0)
      );

      return {
        id: rawWorkout.id,
        user_id: rawWorkout.user_id ?? "",
        workout_date: rawWorkout.workout_date,
        created_at: rawWorkout.created_at,
        exercises,
        date: localDate,
        time: localTime,
        totalVolume: hasWeight ? totalVolume : null,
        totalDistance: hasDistance ? totalDistance : null,
        totalDuration: hasDuration ? totalDuration : null,
      };
    });

  return formattedWorkouts;
}