### Detailed Document: Supabase Schema Design for Workout App Enhancements

#### Overview
This document details the enhancements made to the existing Supabase schema to support a broader range of exercise types (weighted, cardio, flexibility, bodyweight), equipment tracking, and user-created exercises. The design prioritizes security, scalability, and performance while ensuring the schema is production-ready and manageable.

#### Requirements Addressed
- **Exercise Types**: Support for weighted, cardio, flexibility, and bodyweight exercises with appropriate metrics (reps, weight, duration, distance).
- **Equipment Tracking**: Ability to associate exercises with equipment and filter by equipment.
- **User-Created Exercises**: Users can create custom exercises with a limit of 10 per user.
- **UI Adaptation**: The schema supports an exercise editor that adapts based on exercise type and metrics.
- **Security**: Row-level security (RLS), triggers, and constraints ensure data integrity and user isolation.
- **Scalability**: Optimized for read-heavy operations with indexing and denormalized stats.
- **Management**: Schema split into three files (tables, functions/triggers, policies) and a separate seeding file.

#### Key Design Decisions
1. **Exercise Types and Metrics**:
   - Exercises are categorized into 'Strength Training', 'Cardio', 'Flexibility', and 'Other'.
   - Metric flags (`uses_reps`, `uses_weight`, `uses_duration`, `uses_distance`) define which metrics apply to each exercise.
   - The `sets` table now includes nullable `reps` and `weight_kg`, plus new fields `duration_seconds` and `distance_meters`.

2. **Equipment Tracking**:
   - New `equipment` table stores equipment types with soft delete support.
   - Many-to-many relationships via `exercise_equipment` (predefined exercises) and `user_exercise_equipment` (user exercises).

3. **User-Created Exercises**:
   - `user_exercises` table mirrors `exercises` structure with a cap of 10 per user, enforced by a trigger.
   - Constraints ensure valid data (e.g., name length ≤ 20, at least one metric).

4. **Workout Exercises**:
   - `workout_exercises` now supports both predefined and user-created exercises with `exercise_type`, `predefined_exercise_id`, and `user_exercise_id`.
   - Added `effort_level` for subjective feedback.

5. **Security**:
   - RLS policies restrict access to user-owned data.
   - Triggers enforce limits (e.g., 10 user exercises) and validate set metrics.
   - Constraints prevent invalid or malicious input.

6. **Performance**:
   - Indexes on frequently queried fields (e.g., `user_id`, `workout_date`).
   - Denormalized `total_volume` and `daily_volume` for fast reads.

#### Schema Changes
- **Added Tables**:
  - `equipment`: Stores equipment with `id`, `name`, and `is_deleted`.
  - `exercise_equipment`: Links predefined exercises to equipment.
  - `user_exercises`: Stores user-created exercises with metric flags and constraints.
  - `user_exercise_equipment`: Links user exercises to equipment.

- **Modified Tables**:
  - `available_exercises` → `exercises`: Renamed, added `category`, metric flags, `is_deleted`.
  - `workout_exercises`: Replaced `exercise_id` with `exercise_type`, `predefined_exercise_id`, `user_exercise_id`; added `effort_level`.
  - `sets`: Made `reps` and `weight_kg` nullable; added `duration_seconds`, `distance_meters`.

- **Added Functions/Triggers**:
  - `check_exercise_limit()`: Caps user exercises at 10.
  - `validate_set_metrics()`: Ensures set metrics match exercise requirements.

- **Modified Functions/Triggers**:
  - Updated volume calculation functions (`update_volume_on_set_insert`, `update_volume_on_set_delete`, `update_volume_on_set_update`) to handle nullable `reps` and `weight_kg`.

- **Added/Updated Policies**:
  - New RLS policies for `equipment`, `exercise_equipment`, `user_exercises`, `user_exercise_equipment`.
  - Updated policies for `workout_exercises` and `sets` to handle user exercises.

- **Preserved**:
  - All existing tables, functions, triggers, and policies unless explicitly modified for enhancement.

#### Summary of Changes
- **Added**: `equipment`, `exercise_equipment`, `user_exercises`, `user_exercise_equipment`; new functions/triggers; new policies.
- **Edited**: `exercises`, `workout_exercises`, `sets`; volume functions; existing policies.
- **Removed**: None (all existing elements retained or enhanced).

#### Insights
- **Strengths**:
  - **Flexibility**: Metric flags allow diverse exercise types without schema changes.
  - **Security**: RLS, triggers, and constraints ensure robust data protection.
  - **Performance**: Indexing and denormalization optimize read-heavy workloads.

- **Limitations**:
  - **Metric Complexity**: Exercises with unique metrics (e.g., speed) may require additional fields.
  - **Hybrid Sets**: Sets combining multiple metrics (e.g., reps and duration) rely on app-level validation.
  - **Scalability**: Very high user volumes may need further indexing or partitioning.

- **Security Considerations**:
  - **RLS**: Ensures data isolation per user.
  - **Triggers**: Prevent abuse (e.g., exceeding exercise limits).
  - **Constraints**: Enforce data validity (e.g., positive values, category enums).

#### Future Enhancements
- Add support for new metrics (e.g., `uses_speed`) with corresponding fields.
- Introduce exercise tags for finer categorization.
- Support real-time workout tracking with additional tables or fields.