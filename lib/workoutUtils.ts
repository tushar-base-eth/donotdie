import { supabase } from '@/lib/supabase/browser';
import type { UIExtendedWorkout, NewWorkout, UIWorkoutExercise, Database } from "@/types/workouts";
import { parseISO } from "date-fns";
import { formatUtcToLocalDate, formatUtcToLocalTime } from '@/lib/utils';

/**
 * Fetches all workouts for a user with pagination, including exercises and sets, formatted for UI display.
 * @param userId - The ID of the user whose workouts to fetch.
 * @param pageIndex - The page number (0-based) for pagination.
 * @param pageSize - Number of workouts per page.
 * @returns A promise resolving to an array of formatted workouts.
 */
export async function fetchWorkouts(userId: string, pageIndex: number, pageSize: number): Promise<UIExtendedWorkout[]> {
  const start = pageIndex * pageSize;
  const end = start + pageSize - 1;

  type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"] & {
    workout_exercises: (Database["public"]["Tables"]["workout_exercises"]["Row"] & {
      exercises: Database["public"]["Tables"]["exercises"]["Row"] | null;
      user_exercises: any | null; // Not used currently, placeholder for future support
      sets: Database["public"]["Tables"]["sets"]["Row"][];
    })[];
  };

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
    .order("set_number", { ascending: true, foreignTable: "workout_exercises.sets" })
    .range(start, end) as { data: WorkoutRow[] | null; error: any };

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
        if (isNaN(utcDate.getTime())) {
          console.error(`Invalid workout_date for workout ${rawWorkout.id}: ${rawWorkout.workout_date}`);
          utcDate = parseISO(rawWorkout.created_at as string) || new Date();
        }
      } else {
        console.warn(`Missing workout_date for workout ${rawWorkout.id}, using created_at`);
        utcDate = parseISO(rawWorkout.created_at as string) || new Date();
      }
      const localDate = formatUtcToLocalDate(utcDate.toISOString());
      const localTime = formatUtcToLocalTime(utcDate.toISOString());

      const exercises: UIWorkoutExercise[] = rawWorkout.workout_exercises.map((we: WorkoutRow["workout_exercises"][number]) => {
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
            uses_reps: exerciseData?.uses_reps ?? true,
            uses_weight: exerciseData?.uses_weight ?? true,
            uses_duration: exerciseData?.uses_duration ?? false,
            uses_distance: exerciseData?.uses_distance ?? false,
            is_deleted: exerciseData?.is_deleted ?? false,
            source: we.exercise_type,
          },
          sets: we.sets ?? [],
        };
      });

      return {
        id: rawWorkout.id,
        user_id: rawWorkout.user_id ?? "",
        workout_date: rawWorkout.workout_date,
        created_at: rawWorkout.created_at,
        exercises,
        date: localDate,
        time: localTime,
        totalVolume: exercises.reduce((sum, ex) => {
          const sets = Array.isArray(ex.sets) ? ex.sets : [];
          if (!Array.isArray(ex.sets)) {
            console.warn(`Invalid sets for exercise in workout ${rawWorkout.id}:`, ex);
          }
          return sum + sets.reduce((setSum, set) => {
            const reps = Number(set.reps) || 0;
            const weight_kg = Number(set.weight_kg) || 0;
            if (isNaN(reps * weight_kg)) {
              console.warn(`NaN in volume calc for set in workout ${rawWorkout.id}:`, set);
            }
            return setSum + (reps * weight_kg);
          }, 0);
        }, 0),
      };
    });

  return formattedWorkouts;
}

// ... (other functions remain unchanged)