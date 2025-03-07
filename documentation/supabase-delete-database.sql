-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_on_workout_delete ON public.workouts;
DROP TRIGGER IF EXISTS trigger_on_workout_insert ON public.workouts;
DROP TRIGGER IF EXISTS update_volume_after_set_insert ON public.sets;
DROP TRIGGER IF EXISTS update_volume_after_set_delete ON public.sets;
DROP TRIGGER IF EXISTS update_volume_after_set_update ON public.sets;
DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;

-- Drop all custom functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.on_workout_delete();
DROP FUNCTION IF EXISTS public.on_workout_insert();
DROP FUNCTION IF EXISTS public.update_volume_on_set_insert();
DROP FUNCTION IF EXISTS public.update_volume_on_set_delete();
DROP FUNCTION IF EXISTS public.update_volume_on_set_update();
DROP FUNCTION IF EXISTS public.update_timestamp();

-- Drop all tables in dependency order with CASCADE
DROP TABLE IF EXISTS public.sets CASCADE;
DROP TABLE IF EXISTS public.workout_exercises CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.daily_volume CASCADE;
DROP TABLE IF EXISTS public.available_exercises CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Optional: Drop the UUID extension (uncomment if desired)
-- DROP EXTENSION IF EXISTS "uuid-ossp";