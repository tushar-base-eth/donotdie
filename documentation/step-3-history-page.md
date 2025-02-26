# Step 3: History Page Integration with Supabase

## Overview

The history page (`app/history/page.tsx`) displays a user’s past workouts, fetched from Supabase, allowing them to view, filter by date, and delete workouts. This step integrates Supabase data into the existing UI, replacing mock data, and ensures type safety and cross-platform compatibility.

## Components and Responsibilities

### `app/history/page.tsx` (Parent Component)

- **Purpose:** Coordinates data fetching and state management for the history page.
- **Responsibilities:**
  - Fetches all workouts for the user from Supabase on page load and refresh.
  - Manages `selectedDate` (for filtering), `selectedWorkout` (for details), `workouts` (list data), and `isRefreshing` states.
  - Transforms raw Supabase data into `UIExtendedWorkout` format, adding UI-specific fields (`date`, `time`, `totalVolume`).
  - Filters `displayedWorkouts` based on `selectedDate`.
  - Handles pull-to-refresh via touch events.
  - Deletes workouts from Supabase and updates local state.
- **Key Logic:**
  - Query: `supabase.from("workouts").select("id, user_id, created_at, workout_exercises(...)")`.
  - Transformation: Maps `workout_exercises` to `exercises` for type alignment.
  - Timezone: Uses local timezone via `toLocaleTimeString`.

### `components/history/calendar.tsx`

- **Purpose:** Displays a monthly calendar with workout dates highlighted.
- **Responsibilities:**
  - Renders a grid of days for the current month.
  - Highlights days with workouts using `workoutDates` (a `Set<string>`).
  - Updates the displayed month via `onDateChange` (e.g., arrow clicks).
  - Notifies parent of date selection via `onDateSelect`.
- **Props:**
  - `currentDate: Date` (current month or selected date).
  - `workoutDates: Set<string>` (dates with workouts).
  - `onDateChange: (date: Date) => void`.
  - `onDateSelect: (date: string) => void`.
- **Notes:** Pure UI component—no data fetching.

### `components/history/workout-list.tsx`

- **Purpose:** Lists workouts with swipe-to-delete functionality.
- **Responsibilities:**
  - Displays a list of workouts with `date`, `time`, and `totalVolume`.
  - Supports swipe-to-delete via `onWorkoutDelete`.
  - Triggers workout selection for details via `onWorkoutSelect`.
- **Props:**
  - `workouts: UIExtendedWorkout[]` (list to display).
  - `onWorkoutSelect: (workout: UIExtendedWorkout) => void`.
  - `onWorkoutDelete: (workoutId: string) => void`.

### `components/history/workout-details.tsx`

- **Purpose:** Shows detailed view of a selected workout.
- **Responsibilities:**
  - Renders a modal with exercise names and sets (reps, weight).
  - Closes via `onClose`.
- **Props:**
  - `workout: UIExtendedWorkout | null`.
  - `onClose: () => void`.

### Supporting Files

- **`types/workouts.ts`:**
  - Defines `Workout`, `WorkoutExercise`, `Set`, `Exercise`, and `UIExtendedWorkout`.
  - Extends `database.ts` types with app-specific nesting and UI fields.
- **`types/database.ts`:**
  - Generated Supabase types, source of truth for raw schema.
- **`src/lib/utils.ts`:**
  - Provides `generateUUID` for cross-browser UUID generation.

## User Flows

### Initial Load

1. User navigates to `/history`.
2. `HistoryPage` fetches all workouts for user `8e189739-3735-4495-abd1-7ddccee640ac`.
3. `Calendar` displays current month with workout dates highlighted.
4. `WorkoutList` shows all workouts, sorted by `created_at` (newest first).

### Change Calendar Month

1. User clicks `<` or `>` in `Calendar`.
2. `onDateChange` updates `currentDate`, refreshing the calendar view.
3. `WorkoutList` remains unchanged (shows all workouts unless filtered).

### Filter by Date

1. User clicks a date in `Calendar` with a workout.
2. `onDateSelect` finds the workout for that date and sets `selectedWorkout`.
3. `selectedDate` updates, filtering `displayedWorkouts` to that date.
4. `WorkoutDetails` opens with selected workout’s exercises and sets.

### View Workout Details

1. User clicks a workout in `WorkoutList` or selects a date.
2. `onWorkoutSelect` sets `selectedWorkout`.
3. `WorkoutDetails` modal displays exercise names and sets.

### Delete Workout

1. User swipes a workout left in `WorkoutList`.
2. `onWorkoutDelete` triggers `handleDeleteWorkout`.
3. Deletes from Supabase, updates user stats via `update_user_stats_on_delete`, and refreshes local state.

### Pull-to-Refresh

1. User pulls down on the page.
2. Touch events trigger `handleRefresh`, re-fetching workouts.

### Navigation Away and Back

1. User navigates to `/` or `/dashboard`, then returns to `/history`.
2. `useEffect` re-fetches workouts, resetting `selectedDate` to `null`.

## Key Design Choices

1. **Simple MVP Approach:**

   - Fetch all workouts at once, no pagination (sufficient for small datasets).
   - Rationale: Simplifies implementation, meets MVP needs, scalable later with infinite scroll.

2. **Local Timezone Display:**

   - Use `toLocaleTimeString` without `timeZone` option to reflect user’s device timezone.
   - Rejected hardcoded offset (e.g., UTC+7) for flexibility across regions.

3. **Type Safety with Supabase:**

   - Use `database.ts` as raw schema truth, mapped to `workouts.ts` for app-specific types.
   - Explicit transformation in `fetchWorkouts` ensures `exercises` matches `Workout` type.

4. **Cross-Browser UUID Generation:**

   - Replaced `crypto.randomUUID()` with `generateUUID()` utility for iPhone compatibility.
   - Rationale: Ensures older browsers (e.g., Safari pre-15.4) work without errors.

5. **Error Handling:**
   - Added safeguards for `undefined` or `null` `workout_exercises` and `sets`.
   - Ensures robustness even with edge-case data (though your rules prevent empty workouts).

## Implementation Notes

- **Supabase Query:** `select("id, user_id, created_at, workout_exercises(...)")` fetches nested data, transformed to `exercises`.
- **Timezone Fix:** Removed hardcoded `Asia/Bangkok` after verifying `toLocaleTimeString` works with local settings.
- **Dependencies:** Relies on `supabase-js`, `framer-motion`, and custom components (`Calendar`, `WorkoutList`, `WorkoutDetails`).

## Known Limitations

- **No Pagination:** Loads all workouts—fine for MVP but may need infinite scroll for large datasets.
- **Static User ID:** Hardcoded `8e189739-...`—to be replaced with auth in Step 5.

## Next Steps

- Step 4: Integrate Supabase into `dashboard/page.tsx` for user stats and volume trends.
