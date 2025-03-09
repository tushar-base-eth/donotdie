### Detailed Document: Supabase Schema Design for Workout App Enhancements

#### Overview
This document outlines the enhancements to the Supabase schema for a workout app, enabling support for a diverse range of exercise types—including weighted, cardio, flexibility, and bodyweight exercises—as well as equipment tracking and user-created exercises. These updates ensure the schema meets the app’s functional requirements while prioritizing security, scalability, and maintainability. Key enhancements include:

- **System-Defined Exercises**: Predefined exercises available to all users.
- **User-Defined Exercises**: Custom exercises created by users, limited to 10 per user.
- **Exercise Type Variety**: Support for multiple exercise categories with relevant metrics (e.g., reps, weight, duration, distance).
- **Equipment Integration**: Association of exercises with equipment for tracking and filtering.
- **UI Flexibility**: Schema support for an adaptive exercise editor based on exercise type and metrics.

The schema is production-ready, organized into separate files (tables, functions/triggers, policies, and seeding), and optimized for performance and security.

---

#### Requirements Addressed
The following requirements are fully supported by the finalized schema:

1. **Exercise Types**:
   - Support for **weighted**, **cardio**, **flexibility**, and **bodyweight** exercises.
   - Each exercise type is associated with specific metrics:
     - **Weighted**: Reps and weight (in kilograms).
     - **Cardio**: Duration (in seconds) and distance (in meters).
     - **Flexibility**: Duration (in seconds).
     - **Bodyweight**: Reps.
   - Metrics are enforced at the data level to ensure consistency.

2. **Equipment Tracking**:
   - Exercises (system-defined and user-defined) can be linked to specific equipment.
   - Users can filter exercises based on available equipment.

3. **User-Created Exercises**:
   - Users can create custom exercises with a maximum limit of 10 per user.
   - Custom exercises include attributes like name, category, muscle groups, and applicable metrics, mirroring system-defined exercises.

4. **UI Adaptation**:
   - The schema supports an exercise editor that dynamically adjusts input fields based on the exercise type and its required metrics (e.g., showing weight and reps for weighted exercises, duration for cardio).

5. **Security**:
   - **Row-Level Security (RLS)**: Ensures users can only access and modify their own data (e.g., workouts, custom exercises).
   - **Triggers**: Enforce limits (e.g., 10 user exercises) and validate data (e.g., set metrics match exercise type).
   - **Constraints**: Prevent invalid data entries (e.g., negative reps, invalid categories).

6. **Scalability**:
   - Optimized for read-heavy operations with indexing on key fields (e.g., `user_id`, `workout_date`).
   - Denormalized fields (e.g., `total_volume`, `daily_volume`) provide fast access to aggregate data.

7. **Management**:
   - Schema is split into three files: tables, functions/triggers, and policies, with a separate seeding file for initial data population.

---

#### Key Design Decisions
The schema design reflects deliberate choices to meet the above requirements:

1. **Exercise Types and Metrics**:
   - Exercises are classified into categories (`strength_training`, `cardio`, `flexibility`, `other`) using an ENUM.
   - Metric flags (`uses_reps`, `uses_weight`, `uses_duration`, `uses_distance`) indicate which metrics apply to each exercise.
   - The `sets` table includes nullable fields (`reps`, `weight_kg`, `duration_seconds`, `distance_meters`) to accommodate all exercise types.
   - A trigger (`validate_set_metrics`) ensures that set data aligns with the exercise’s defined metrics.

2. **Equipment Tracking**:
   - A new `equipment` table stores equipment types with a soft-delete flag (`is_deleted`).
   - Many-to-many relationships are managed via:
     - `exercise_equipment`: Links system-defined exercises to equipment.
     - `user_exercise_equipment`: Links user-defined exercises to equipment.

3. **User-Created Exercises**:
   - The `user_exercises` table mirrors the `exercises` table, including fields for category, muscle groups, and metric flags.
   - A trigger (`check_exercise_limit`) enforces the 10-exercise limit per user.
   - Constraints ensure data validity (e.g., name ≤ 50 characters, at least one metric flag set to true).

4. **Workout Exercises**:
   - The `workout_exercises` table supports both exercise types using:
     - `exercise_type`: Indicates whether the exercise is predefined or user-defined.
     - `predefined_exercise_id`: References system-defined exercises.
     - `user_exercise_id`: References user-defined exercises.
   - Added `effort_level` to capture subjective user feedback on intensity.

5. **Security**:
   - RLS policies restrict access to user-specific data (e.g., workouts, custom exercises).
   - Triggers enforce business rules (e.g., exercise limits, metric validation).
   - Constraints ensure data integrity (e.g., positive values, valid ENUM categories).

6. **Performance**:
   - Indexes on frequently queried fields (e.g., `user_id`, `workout_date`, foreign keys) improve query performance.
   - Denormalized fields (`total_volume` in `profiles`, `daily_volume` table) accelerate aggregate calculations.

---

#### Schema Changes
The finalized schema includes the following updates:

- **Added Tables**:
  - **`equipment`**:
    - Fields: `id`, `name`, `is_deleted` (soft delete).
    - Purpose: Stores equipment types.
  - **`exercise_equipment`**:
    - Fields: `exercise_id`, `equipment_id`.
    - Purpose: Links system-defined exercises to equipment.
  - **`user_exercises`**:
    - Fields: `id`, `user_id`, `name`, `category`, `primary_muscle_group`, `secondary_muscle_group`, metric flags (`uses_reps`, etc.), `is_deleted`.
    - Purpose: Stores user-created exercises.
  - **`user_exercise_equipment`**:
    - Fields: `user_exercise_id`, `equipment_id`.
    - Purpose: Links user-defined exercises to equipment.

- **Modified Tables**:
  - **`available_exercises` → `exercises`**:
    - Renamed and enhanced with `category`, `primary_muscle_group`, `secondary_muscle_group`, metric flags, `is_deleted`.
  - **`workout_exercises`**:
    - Replaced `exercise_id` with `exercise_type`, `predefined_exercise_id`, `user_exercise_id`.
    - Added `effort_level`.
  - **`sets`**:
    - Made `reps` and `weight_kg` nullable.
    - Added `duration_seconds` and `distance_meters`.

- **Added Functions/Triggers**:
  - **`check_exercise_limit()`**: Limits users to 10 custom exercises.
  - **`validate_set_metrics()`**: Validates that set metrics match the exercise’s requirements.

- **Modified Functions/Triggers**:
  - Updated volume calculation triggers (`update_volume_on_set_insert`, `update_volume_on_set_delete`, `update_volume_on_set_update`) to handle nullable fields and skip non-weighted exercises.

- **Added/Updated Policies**:
  - New RLS policies for `equipment`, `exercise_equipment`, `user_exercises`, `user_exercise_equipment`.
  - Updated policies for `workout_exercises` and `sets` to support both exercise types.

- **Preserved**:
  - All existing tables, functions, triggers, and policies not explicitly modified.

---

#### Summary of Changes
- **Added**: New tables (`equipment`, `exercise_equipment`, `user_exercises`, `user_exercise_equipment`), functions/triggers (`check_exercise_limit`, `validate_set_metrics`), and policies.
- **Edited**: Modified tables (`exercises`, `workout_exercises`, `sets`), volume functions, and existing policies.
- **Removed**: None (all original elements were retained or enhanced).

---

#### Insights
- **Strengths**:
  - **Flexibility**: Metric flags enable support for diverse exercise types without structural changes.
  - **Security**: RLS, triggers, and constraints provide robust data protection and integrity.
  - **Performance**: Indexing and denormalization optimize read-heavy operations for dashboards and reports.

- **Limitations**:
  - **Metric Complexity**: Exercises requiring unique metrics (e.g., speed, incline) may need additional fields or flags.
  - **Hybrid Sets**: Sets combining multiple metrics (e.g., reps and duration) rely on app-level validation due to strict schema enforcement.
  - **Scalability**: Extremely high user volumes may require advanced optimizations (e.g., partitioning).

- **Security Considerations**:
  - **RLS**: Isolates data by user, ensuring privacy.
  - **Triggers**: Prevent abuse (e.g., exceeding limits) and enforce rules (e.g., metric validation).
  - **Constraints**: Guarantee data validity (e.g., positive values, ENUM compliance).

---

#### Future Enhancements
- **Additional Metrics**: Add flags (e.g., `uses_speed`, `uses_incline`) and corresponding fields in `sets`.
- **Exercise Tags**: Implement a tagging system for enhanced categorization and filtering.
- **Real-Time Tracking**: Introduce tables or fields for live workout tracking and progress sharing.