git commit -m "feat: Standardize data fetching and mutations with SWR and custom hooks" -m "$(cat <<EOF
This commit standardizes data operations across the application by introducing custom SWR hooks in \`lib/hooks/data-hooks.ts\` and updating key components (\`app/dashboard/page.tsx\`, \`app/history/page.tsx\`, \`components/workout/workout.tsx\`, \`components/workout/exercise-selector.tsx\`) to use these hooks. The changes improve maintainability, leverage SWR's caching and revalidation features, and enhance UX with optimistic updates. Additional fixes address TypeScript errors and ensure consistency.

### Changes:

#### New File: \`lib/hooks/data-hooks.ts\`
- Added custom SWR hooks to centralize data fetching and mutations:
  - \`useProfile\`: Fetches user profile data with deduping (60s interval).
  - \`useWorkouts\`: Implements paginated workout fetching with infinite scrolling; keys use stringified \`pageIndex\` and \`pageSize\` for consistency, parsed back to numbers in the fetcher.
  - \`useSaveWorkout\`: Saves workouts with optimistic updates, targeting the first page (\`["workouts", userId, "0", "10"]\`) and revalidating profile and workout caches.
  - \`useDeleteWorkout\`: Deletes workouts optimistically, filtering keys by user ID and revalidating caches.
  - \`useVolumeData\`: Fetches volume data based on time range.
  - \`useAvailableExercises\`: Fetches exercise list with long-term caching (1 hour).

#### Updated: \`app/dashboard/page.tsx\`
- Replaced direct SWR calls with \`useProfile\` and \`useVolumeData\` hooks.
- Fixed TypeScript errors:
  - Destructured \`mutate\` as \`mutateProfile\` and \`mutateVolume\` for retry functionality.
  - Added \`volumeData || []\` to safely handle undefined \`volumeData\` in \`formattedVolumeData\`.
- Improved error handling: Retry button now calls \`mutateProfile()\` and \`mutateVolume()\` correctly.
- Maintained loading skeleton and profile data checks.

#### Updated: \`app/history/page.tsx\`
- Switched to \`useWorkouts\` for paginated workout fetching and \`useDeleteWorkout\` for deletions with optimistic updates.
- Enhanced error handling: Retry button uses \`mutate()\` instead of \`setSize(1)\` for proper re-fetching.
- Kept infinite scrolling with loading spinner for initial fetch (\`isLoading && workouts.length === 0\`).

#### Updated: \`components/workout/workout.tsx\`
- Integrated \`useSaveWorkout\` for saving workouts with optimistic updates, replacing direct Supabase calls.
- Improved UX by resetting local state and showing success/error toasts post-save.
- Retained existing loading and transition logic.

#### Updated: \`components/workout/exercise-selector.tsx\`
- Adopted \`useAvailableExercises\` for fetching exercises, ensuring consistent data access.
- Added error handling with retry option via \`mutate()\`.
- Defaulted \`exercises\` to empty array (\`data || []\`) for safety.

#### Bug Fixes and Consistency:
- Resolved TypeScript errors:
  - \`TS2339\`: Fixed incorrect \`mutate\` access by proper destructuring in \`app/dashboard/page.tsx\`.
  - \`TS18048\`: Handled undefined \`volumeData\` with fallback array.
  - \`TS2345\`: Standardized SWR keys in \`useWorkouts\` to strings, aligning with fetcher expectations.
- Ensured cache key consistency across hooks (e.g., \`["workouts", userId, "0", "10"]\` in \`useSaveWorkout\` matches \`useWorkouts\`).

### Benefits:
- Centralized data logic in reusable hooks.
- Improved performance with SWR caching and deduping.
- Enhanced UX with optimistic updates and proper error recovery.
- Better maintainability and type safety.

### Testing:
- Verify retry buttons re-fetch data correctly.
- Confirm loading states (skeleton/spinner) display as expected.
- Test workout save/delete for optimistic UI updates and cache sync.
EOF
)"