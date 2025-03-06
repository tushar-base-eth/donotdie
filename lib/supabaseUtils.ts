import { supabase } from "./supabaseClient";
import type { UIExtendedWorkout, NewWorkout, WorkoutExercise, Set } from "@/types/workouts";
import { parseISO } from "date-fns";
import { format } from "date-fns";

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
  const { data, error } = await supabase
    .from("workouts")
    .select(`
      id, user_id, created_at,
      workout_exercises (
        id, exercise_id, created_at,
        exercise:available_exercises(*),
        sets (*)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message);
  }

  const formattedWorkouts: UIExtendedWorkout[] = data
    .filter((rawWorkout) => rawWorkout.created_at !== null)
    .map((rawWorkout) => {
      const utcDate = parseISO(rawWorkout.created_at as string);
      const localDate = format(utcDate, "yyyy-MM-dd"); // Uses local timezone
      const localTime = format(utcDate, "hh:mm a"); // Uses local timezone

      const exercises = rawWorkout.workout_exercises
        ? rawWorkout.workout_exercises.map((we) => ({
            id: we.id,
            workout_id: rawWorkout.id,
            exercise_id: we.exercise_id ?? "",
            exercise: {
              id: we.exercise?.id ?? "",
              name: we.exercise?.name ?? "",
              primary_muscle_group: we.exercise?.primary_muscle_group ?? "",
              secondary_muscle_group: we.exercise?.secondary_muscle_group ?? null,
            },
            sets: we.sets ? we.sets.map((set: Set) => ({ reps: set.reps, weight_kg: set.weight_kg })) : [],
            created_at: we.created_at ?? "",
          }))
        : [];

      return {
        id: rawWorkout.id,
        user_id: rawWorkout.user_id ?? "",
        created_at: rawWorkout.created_at,
        exercises,
        utcDate: localDate,
        date: localDate,
        time: localTime,
        totalVolume: exercises.reduce(
          (sum: number, ex: WorkoutExercise) =>
            sum +
            ex.sets.reduce(
              (setSum: number, set: { reps: number; weight_kg: number }) => setSum + set.reps * set.weight_kg,
              0
            ),
          0
        ),
      };
    });

  return formattedWorkouts;
}

/**
 * Saves a new workout, including its exercises and sets. Stats updates are handled by database triggers.
 * @param workout - The workout data to save.
 * @returns A promise that resolves when the workout is saved.
 */
export async function saveWorkout(workout: NewWorkout): Promise<void> {
  try {
    const { data: workoutData, error: workoutError } = await supabase
      .from("workouts")
      .insert({ user_id: workout.user_id })
      .select("id")
      .single();

    if (workoutError) {
      console.error("Error inserting workout:", workoutError);
      throw workoutError;
    }

    const workoutId = workoutData.id;

    for (const ex of workout.exercises) {
      const { data: weData, error: weError } = await supabase
        .from("workout_exercises")
        .insert({ workout_id: workoutId, exercise_id: ex.exercise_id })
        .select("id")
        .single();

      if (weError) {
        console.error("Error inserting workout_exercise:", weError);
        throw weError;
      }

      const weId = weData.id;

      const setsToInsert = ex.sets.map((set: { reps: number; weight_kg: number }) => ({
        workout_exercise_id: weId,
        reps: set.reps,
        weight_kg: set.weight_kg,
      }));

      const { error: setsError } = await supabase.from("sets").insert(setsToInsert);

      if (setsError) {
        console.error("Error inserting sets:", setsError);
        throw setsError;
      }
    }
  } catch (error) {
    console.error("Error saving workout:", error);
    throw error;
  }
}

/**
 * Deletes a workout by ID. Stats updates are handled by database triggers.
 * @param workoutId - The ID of the workout to delete.
 * @returns A promise that resolves when the workout is deleted.
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase.from("workouts").delete().eq("id", workoutId);

  if (error) throw error;
}

/**
 * Fetches profile data for a user.
 * @param userId - The ID of the user.
 * @returns A promise resolving to the profile data.
 */
export async function fetchProfileData(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("total_volume, total_workouts, name, gender, date_of_birth, unit_preference, weight_kg, height_cm, body_fat_percentage")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetches volume data by day for a user over a specified period.
 * @param userId - The ID of the user.
 * @param timeRange - The time range ("7days", "8weeks", "12months").
 * @returns A promise resolving to the volume data array.
 */
export async function fetchVolumeData(userId: string, timeRange: string) {
  const daysToFetch = timeRange === "7days" ? 7 : timeRange === "8weeks" ? 56 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToFetch);

  const { data, error } = await supabase
    .from("daily_volume")
    .select("date, volume")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split('T')[0]) // 'YYYY-MM-DD' format
    .order("date", { ascending: true });

  if (error) throw error;

  // Ensure data is in the expected format: { date: string, volume: number }[]
  return data.map(row => ({ date: row.date, volume: row.volume }));
}

/**
 * Fetches all available exercises.
 * @returns A promise resolving to an array of exercises.
 */
export async function fetchAvailableExercises() {
  const { data, error } = await supabase.from("available_exercises").select("*");
  if (error) throw error;
  return data;
}