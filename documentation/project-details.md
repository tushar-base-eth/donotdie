## Project Document: Zero - Next.js Web Application Implementation Details

This document outlines the implementation details of the Zero Next.js web application. It is organized by page/section to facilitate understanding of the project's key components and functionalities.

---

### 1. Landing Page (`app/page.tsx`)

**Purpose:**  The entry point for non-authenticated users, showcasing app features and prompting login/signup.

**Files:**
- `app/page.tsx`
- `components/ui/button.tsx`
- `lucide-react` (icons: `Dumbbell`, `Heart`, `BarChart`)

**Key Components:**
- `LandingPage`: Functional component displaying features and a "Get Started" button.
- `Button`: UI component for primary action.
- Icons from `lucide-react`: Visual representation of features.
- `framer-motion`: For animations on page load.

**API Endpoints:** None

**Data Flow:** Static content, no external data fetching.

**Key Logic:**
- Feature list is statically defined within the component.
- "Get Started" button navigates to the login page (`/auth/login`).

---

### 2. Authentication Pages (`app/auth/login/page.tsx`, `app/auth/signup/page.tsx`)

**Purpose:**  Handles user login and signup functionalities using Supabase Auth.

**Files:**
- `app/auth/login/page.tsx`
- `app/auth/signup/page.tsx`
- `app/api/auth/*` (API routes for auth actions)
- `components/auth/LoginForm.tsx`
- `components/auth/GoogleSignInButton.tsx`
- `components/ui/*` (various UI components)
- `contexts/profile-context.tsx` (for user profile management after login)
- `lib/supabase/*` (Supabase client setup)

**Key Components:**
- `LoginPage`, `SignupPage`: Page components for login and signup forms.
- `LoginForm`: Reusable component for email/password login.
- `GoogleSignInButton`: Button for Google OAuth login.
- UI components from `components/ui`: `Button`, `Input`, `Label`, `Tabs`, `Card`, `Alert`, `useToast`, `Select`, `Form`, `FormField`, `FormControl`, `FormItem`, `FormLabel`, `FormMessage`.
- `motion` from `framer-motion`: For animations.
- `CheckCircle2` from `lucide-react`: Success icon.
- `useUserProfile` from `contexts/profile-context`: To manage user profile state.

**API Endpoints:**
- `/api/auth/login` (POST): Email/password login
- `/api/auth/signup` (POST): User signup
- `/api/auth/google` (GET): Initiate Google OAuth login
- `/api/auth/callback` (GET): Supabase OAuth callback handler
- `/api/auth/magiclink` (POST): Send magic link login email

**Data Flow:**
- User input from forms is sent to API endpoints.
- API endpoints interact with Supabase Auth for user authentication and session management.
- On successful login/signup, user session is established and potentially profile data is fetched and stored in `ProfileContext`.
- Redirection to `/home` or other pages upon successful authentication.

**Key Logic:**
- **Login:** Handles email/password and magic link login flows. Uses `LoginForm` component.
- **Signup:** Handles user registration, including email, password, name, and unit preference. Uses `react-hook-form` and `zod` for form validation. Confirmation email sent after signup.
- **Google OAuth:** Implements Google Sign-In using Supabase OAuth. Redirects to Google login page and handles callback.
- **Error Handling:** Displays error messages using `Alert` component and `useToast` for notifications.
- **State Management:** Uses `useState` for form input, loading states, and error messages.

---

### 3. Dashboard Page (`app/dashboard/page.tsx`)

**Purpose:**  Displays key workout metrics and volume chart for logged-in users.

**Files:**
- `app/dashboard/page.tsx`
- `components/dashboard/metrics-cards.tsx`
- `components/dashboard/volume-chart.tsx`
- `components/loading/metrics-skeleton.tsx`
- `components/ui/card.tsx`, `components/ui/button.tsx`, `components/ui/tabs.tsx`
- `lib/hooks/use-dashboard-data.ts`
- `lib/hooks/use-unit-preference.ts`
- `contexts/profile-context.tsx`
- `recharts` (for charting)

**Key Components:**
- `DashboardPage`: Main dashboard page component.
- `MetricsCards`: Displays total workouts and total volume metrics.
- `VolumeChart`: Renders a bar chart of workout volume over time.
- `MetricsSkeleton`: Skeleton UI for loading state.
- UI components: `Card`, `CardContent`, `Button`, `Tabs`, `TabsList`, `TabsTrigger`.
- `motion` from `framer-motion`: For animations.

**API Endpoints:**
- Data fetched through custom hooks, which internally use Supabase client and potentially API routes (though not explicitly defined in provided files for dashboard data).

**Data Flow:**
- `useDashboardData` hook fetches volume data and dashboard metrics based on user ID and selected time range.
- `useUnitPreference` hook provides formatting functions based on user's unit preference.
- Data is passed to `MetricsCards` and `VolumeChart` components for display.

**Key Logic:**
- **Data Fetching:** `useDashboardData` hook handles fetching and formatting of dashboard data.
- **Time Range Selection:** `VolumeChart` allows users to switch between "7 days", "8 weeks", and "12 months" views using Tabs.
- **Chart Rendering:** `recharts` library is used to render the volume bar chart.
- **Loading State:** `MetricsSkeleton` is displayed during data loading.
- **Error Handling:** Displays an error message and retry button if data loading fails.

---

### 4. History Page (`app/history/page.tsx`)

**Purpose:**  Allows users to view, filter, and manage their workout history.

**Files:**
- `app/history/page.tsx`
- `components/history/calendar.tsx`
- `components/history/workout-list.tsx`
- `components/history/workout-details.tsx`
- `components/ui/*` (various UI components)
- `contexts/history-context.tsx` (for managing history page state)
- `contexts/profile-context.tsx`
- `lib/hooks/use-filtered-workouts.ts`
- `lib/hooks/data-hooks.ts`
- `react-infinite-scroll-component` (for infinite scrolling)
- `date-fns` (for date formatting)

**Key Components:**
- `HistoryPage`, `HistoryPageInner`: Main history page components. `HistoryPageInner` is wrapped by `HistoryProvider`.
- `Calendar`: Interactive calendar to select workout dates.
- `WorkoutList`: Displays a list of workouts, supporting swipe-to-delete action.
- `WorkoutDetails`: Sheet component to display detailed information for a selected workout.
- UI components: `Card`, `CardContent`, `Button`, `Badge`, `toast` (from `useToast`), `Sheet`, `SheetContent`, `SheetTitle`.
- Icons: `ChevronLeft`, `ChevronRight`, `X`, `CheckCircle`.
- `motion` from `framer-motion`: For animations and swipe gestures.
- `InfiniteScroll` from `react-infinite-scroll-component`: For loading workouts in chunks (though pagination is not fully implemented in the provided code).

**API Endpoints:**
- Data fetched through custom hooks, which internally use Supabase client.
- `/api/workouts` (implicitly used via `useWorkouts` hook).

**Data Flow:**
- `HistoryProvider` manages the state for selected date, selected workout, and pending deletions.
- `useWorkouts` hook fetches all workouts for the user.
- `useFilteredWorkouts` hook filters workouts based on selected date and pending deletions.
- `Calendar` component displays workout dates and allows date selection.
- `WorkoutList` displays the filtered workouts and handles swipe-to-delete.
- `WorkoutDetails` displays workout details in a sheet when a workout is selected.

**Key Logic:**
- **Date Filtering:** `Calendar` and `useFilteredWorkouts` enable filtering workouts by date.
- **Workout Display:** `WorkoutList` renders workouts with date, time, and summary metrics.
- **Workout Deletion:** Implements swipe-to-delete functionality using `framer-motion` drag gestures and `useDeleteWorkout` hook. Optimistic updates with `pendingDeletions` state.
- **Workout Details Sheet:** `WorkoutDetails` component displays detailed exercise and set information in a sheet modal.
- **Infinite Scroll (Partial):** `InfiniteScroll` component is used, but pagination logic is not fully implemented.

---

### 5. Home Page (`app/home/page.tsx`) - Workout Creation

**Purpose:**  Primary page for users to create and track new workouts.

**Files:**
- `app/home/page.tsx`
- `components/workout/workout.tsx`
- `components/workout/workout-exercises.tsx`
- `components/workout/exercise-selector.tsx`
- `components/workout/exercise-editor.tsx`
- `components/workout/category-list.tsx`
- `components/workout/muscle-group-list.tsx`
- `components/workout/equipment-list.tsx`
- `components/workout/exercise-list.tsx`
- `components/loading/exercise-skeleton.tsx`
- `components/ui/*` (extensive use of UI components)
- `contexts/profile-context.tsx`
- `lib/hooks/data-hooks.ts`
- `lib/hooks/use-unit-preference.ts`
- `lib/utils.ts` (UUID generation)
- `framer-motion` (animations)
- `lucide-react` (icons)

**Key Components:**
- `HomePage`: Main component for the home/workout page.
- `Workout`: Container component managing workout state and interactions.
- `WorkoutExercises`: Displays the list of exercises in the current workout.
- `ExerciseSelector`: Sheet component for selecting exercises to add to the workout.
- `ExerciseEditor`: Sheet component for editing sets for a selected exercise.
- Category/Muscle Group/Equipment Lists: Components for filtering exercises in the `ExerciseSelector`.
- `ExerciseList`: Displays the list of exercises in `ExerciseSelector` based on filters and search.
- `ExerciseSkeleton`: Skeleton UI for loading exercises.
- UI components: `Button`, `Input`, `ScrollArea`, `Sheet`, `SheetContent`, `SheetTitle`, `Tabs`, `TabsList`, `TabsTrigger`, `Card`, `CardContent`, `toast` (from `useToast`).
- Icons: `Plus`, `Save`, `X`, `Trash`, `ChevronLeft`, `Leaf`, `Dumbbell`, `Heart`, `User`, `ChevronRight`.
- `motion`, `AnimatePresence` from `framer-motion`: For animations, transitions, and drag gestures.

**API Endpoints:**
- `/api/exercises` (GET): Fetch predefined exercises.
- `/api/equipment` (GET): Fetch equipment list.
- `/api/workouts` (POST): Save a new workout (via `useSaveWorkout` hook).

**Data Flow:**
- `Workout` component manages the state for current workout exercises and selected exercises.
- `ExerciseSelector` fetches available exercises and equipment using `useAvailableExercises` hook.
- Exercise selection and filtering logic is implemented within `ExerciseSelector` and related list components.
- `ExerciseEditor` allows editing sets for individual exercises, updating the workout state.
- `useSaveWorkout` hook handles saving the workout data to the backend via API call.

**Key Logic:**
- **Workout Creation Flow:** Users can add exercises to a workout, edit sets for each exercise, and save the workout.
- **Exercise Selection:** `ExerciseSelector` provides a sheet modal for browsing and searching exercises, with category, muscle group, and equipment filtering.
- **Set Management:** `ExerciseEditor` sheet allows users to input reps, weight, duration, and distance for each set. Swipe-to-delete functionality for sets.
- **Workout Validation:** Basic validation to ensure at least one metric is filled for each set before saving.
- **Data Persistence:** `useSaveWorkout` hook handles saving workout data to Supabase database.
- **State Management:** Extensive use of `useState` for managing workout exercises, selected exercises, selected exercise for editing, search queries, and modal visibility. `useTransition` for non-blocking UI updates during state changes.

---

### 6. Settings Page (`app/settings/page.tsx`)

**Purpose:**  Allows users to manage their profile settings, theme preference, and logout.

**Files:**
- `app/settings/page.tsx`
- `components/settings/ProfileSettings.tsx`
- `components/settings/MeasurementsSettings.tsx`
- `components/loading/profile-skeleton.tsx`
- `components/ui/*` (various UI components)
- `contexts/profile-context.tsx`
- `lib/hooks/use-unit-preference.ts`
- `app/api/profile/route.ts` (API routes for profile management)
- `app/api/auth/logout/route.ts` (API route for logout)
- `next-themes` (for theme management)
- `zod`, `@hookform/resolvers`, `react-hook-form` (for form handling)
- `lucide-react` (icons)
- `framer-motion` (animations)

**Key Components:**
- `Settings`: Main settings page component.
- `ProfileSettings`: Component for editing personal profile information (name, gender, DoB, unit preference).
- `MeasurementsSettings`: Component for editing body measurements (weight, height).
- `ProfileSkeleton`: Skeleton UI for loading profile data.
- UI components: `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`, `Tabs`, `TabsList`, `TabsTrigger`, `Input`, `Select`, `SelectItem`, `SelectTrigger`, `SelectValue`, `Form`, `FormProvider`, `FormField`, `FormControl`, `FormItem`, `FormLabel`, `FormMessage`, `toast` (from `useToast`).
- Icons: `LogOut`, `Sun`, `Moon`, `User`, `Ruler`, `Calendar`.
- `motion` from `framer-motion`: For animations.
- `useTheme` from `next-themes`: For theme switching.

**API Endpoints:**
- `/api/profile` (GET, PATCH): Fetch and update user profile.
- `/api/auth/logout` (POST): User logout.

**Data Flow:**
- `useUserProfile` hook fetches and provides user profile data from `ProfileContext`.
- `useTheme` hook manages theme preference using `next-themes`.
- Form data is handled using `react-hook-form` and validated with `zod`.
- Profile updates are sent to `/api/profile` (PATCH) endpoint.
- Logout action calls `/api/auth/logout` (POST) endpoint.

**Key Logic:**
- **Profile Management:** Allows users to update their profile information, including personal details and body measurements. Uses `ProfileSettings` and `MeasurementsSettings` components.
- **Theme Switching:** Implements light/dark theme switching using `next-themes` and persists theme preference in the user profile.
- **Logout:** Handles user logout by calling the `/api/auth/logout` endpoint and clearing user profile data.
- **Form Handling and Validation:** Uses `react-hook-form` and `zod` for form management and validation in settings forms.
- **Loading State:** `ProfileSkeleton` is displayed during profile data loading.
- **Error Handling:** Displays toast notifications for success and error messages.

---

### 7. Navigation - Bottom Navigation (`components/navigation/bottom-nav.tsx`)

**Purpose:**  Provides bottom navigation for main app sections (Home, History, Dashboard, Settings).

**Files:**
- `components/navigation/bottom-nav.tsx`
- `contexts/profile-context.tsx`
- `next/link`
- `next/navigation` (`usePathname`)
- `lucide-react` (icons)
- `framer-motion` (animations)

**Key Components:**
- `BottomNav`: Functional component rendering the bottom navigation bar.
- `Link` from `next/link`: For client-side navigation.
- Icons from `lucide-react`: `Home`, `History`, `LineChart`, `Settings`.
- `motion.nav` from `framer-motion`: For animation on component mount.

**API Endpoints:** None

**Data Flow:**  Relies on `useUserProfile` context to determine if the user is logged in. Navigation links are static.

**Key Logic:**
- **Conditional Rendering:** Renders navigation only if a user profile exists (user is logged in).
- **Active Link Indication:** Highlights the active navigation item based on the current pathname using `usePathname`.
- **Client-Side Navigation:** Uses `Link` component for smooth client-side transitions between pages.
- **Animation:** Uses `framer-motion` to animate the navigation bar on mount.

---

### 8. API Routes (`app/api/*`)

**Purpose:**  Backend API endpoints for authentication, data fetching, and data updates.

**Files:**
- `app/api/auth/*` (Authentication endpoints: login, signup, logout, google OAuth, magic link, refresh, callback)
- `app/api/equipment/route.ts` (Fetch equipment list)
- `app/api/exercises/route.ts` (Fetch predefined exercises)
- `app/api/profile/route.ts` (Fetch and update user profile)

**Key Logic:**
- **Authentication:** API routes under `app/api/auth/` handle various authentication flows using Supabase Auth.
- **Data Fetching:** `/api/equipment` and `/api/exercises` provide cached endpoints for fetching equipment and exercise data.
- **Profile Management:** `/api/profile` handles fetching and updating user profile data.
- **Supabase Integration:** All API routes utilize `createClient` from `lib/supabase/server.ts` to interact with the Supabase database.
- **Error Handling:** API routes return JSON responses with error messages and appropriate HTTP status codes on failure.
- **Caching:** `/api/equipment` and `/api/exercises` implement caching headers for improved performance.

---

### 9. Contexts (`contexts/*`)

**Purpose:**  Provides global state management for user profile and history page related data.

**Files:**
- `contexts/profile-context.tsx` (`ProfileProvider`, `useUserProfile`)
- `contexts/history-context.tsx` (`HistoryProvider`, `useHistoryContext`)

**Key Logic:**
- **Profile Context (`ProfileContext`):**
    - Manages user profile data (`ProfileState`).
    - Provides functions to `fetchProfile`, `updateProfile`, and `clearProfile`.
    - Uses `useEffect` to fetch profile data on initial load of `/home` page.
    - Makes profile data accessible throughout the application using `useUserProfile` hook.
- **History Context (`HistoryContext`):**
    - Manages state related to the history page: `selectedDate`, `selectedWorkout`, `pendingDeletions`.
    - Provides functions to update these states and manage pending deletions for optimistic UI updates during workout deletion.
    - Makes history page state accessible within the `HistoryPage` component tree using `useHistoryContext` hook.

---

### 10. Lib - Utility and Hook Functions (`lib/*`)

**Purpose:**  Contains reusable utility functions, custom hooks, and Supabase client setup.

**Files:**
- `lib/hooks/*` (Custom React hooks: `data-hooks.ts`, `use-dashboard-data.ts`, `use-filtered-workouts.ts`, `use-unit-preference.ts`)
- `lib/supabase/*` (Supabase client setup: `browser.ts`, `middleware.ts`, `server.ts`)
- `lib/utils.ts` (Utility functions: `cn`, `convertWeight`, `convertHeightToInches`, `convertInchesToCm`, `generateUUID`, `formatUtcToLocalDate`, `formatUtcToLocalTime`, `formatVolumeData`)
- `lib/webauthn.ts` (WebAuthn related functions - not used in provided page implementations but present in project)
- `lib/workoutUtils.ts` (Workout data related utility functions: `fetchAllWorkouts`)

**Key Logic:**
- **Custom Hooks (`lib/hooks/*`):**
    - `data-hooks.ts`: Contains various data fetching and manipulation hooks using `useSWR` for efficient data management with caching and revalidation. Includes hooks for fetching exercises, equipment, volume data, workouts, and saving/deleting workouts.
    - `use-dashboard-data.ts`:  Hook to orchestrate fetching and formatting of dashboard data, using `useVolumeData` internally.
    - `use-filtered-workouts.ts`: Hook to filter workouts based on selected date and pending deletions, using `useWorkouts` internally.
    - `use-unit-preference.ts`: Hook to manage and provide unit preference settings and formatting functions based on user profile.
- **Supabase Client Setup (`lib/supabase/*`):**
    - `browser.ts`: Creates Supabase browser client for client-side components.
    - `middleware.ts`: Creates Supabase client for middleware to handle authentication in middleware.
    - `server.ts`: Creates Supabase server client for server-side components and API routes.
- **Utility Functions (`lib/utils.ts`):**
    - `cn`: Utility for conditional class names using `clsx` and `tailwind-merge`.
    - `convertWeight`, `convertHeightToInches`, `convertInchesToCm`: Unit conversion utilities.
    - `generateUUID`: UUID generation function.
    - `formatUtcToLocalDate`, `formatUtcToLocalTime`: Date formatting utilities.
    - `formatVolumeData`: Function to format volume data for charts based on time range.
- **Workout Utilities (`lib/workoutUtils.ts`):**
    - `fetchAllWorkouts`: Function to fetch all workout data with related exercises and sets from Supabase.

---

### 11. UI Components (`components/ui/*`)

**Purpose:**  Collection of reusable UI components built using Radix UI and Tailwind CSS.

**Files:**
- `components/ui/*` (Numerous UI components: `alert-dialog.tsx`, `alert.tsx`, `avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `form.tsx`, `input.tsx`, `label.tsx`, `pagination.tsx`, `scroll-area.tsx`, `select.tsx`, `sheet.tsx`, `skeleton.tsx`, `tabs.tsx`, `toast.tsx`, `toaster.tsx`, `use-toast.ts`)

**Key Logic:**
- **Reusability:** Provides a consistent and reusable set of UI elements across the application.
- **Radix UI Integration:** Leverages Radix UI primitives for accessibility and component behavior.
- **Tailwind CSS Styling:** Styles components using Tailwind CSS for customization and responsiveness.
- **Theming:** Components are designed to work with the application's theme (light/dark).
- **Common UI Patterns:** Implements common UI patterns like alerts, cards, forms, inputs, selects, sheets, tabs, toasts, etc.

---

### 12. Global Styles and Theme (`app/globals.css`, `tailwind.config.ts`, `postcss.config.mjs`, `components/theme-provider.tsx`)

**Purpose:**  Defines global styles, theme configuration, and theme provider.

**Files:**
- `app/globals.css` (Global CSS styles, theme definitions)
- `tailwind.config.ts` (Tailwind CSS configuration)
- `postcss.config.mjs` (PostCSS configuration)
- `components/theme-provider.tsx` (`ThemeProvider` component using `next-themes`)

**Key Logic:**
- **Global Styles (`globals.css`):**
    - Resets and base styles.
    - Defines CSS variables for light and dark themes, including colors for background, foreground, primary, secondary, muted, accent, destructive, border, input, ring, charts, sidebar, and highlight.
    - Defines a "colorful" theme as well.
- **Tailwind Configuration (`tailwind.config.ts`):**
    - Configures Tailwind CSS settings, including content paths, theme extensions, keyframes, and plugins (`tailwindcss-animate`).
    - Extends default Tailwind theme with custom colors based on CSS variables defined in `globals.css`.
    - Defines "glass" and "glass-dark" background image styles.
    - Configures box shadows and border radii.
- **Theme Provider (`components/theme-provider.tsx`):**
    - Uses `NextThemesProvider` from `next-themes` to provide theme context to the application.
    - Configures theme provider to use "class" attribute, default theme "light", enable system theme, and disable transition on theme change.

---

### 13. Error Handling (`components/ErrorBoundary.tsx`)

**Purpose:**  Provides a client-side error boundary to catch and handle runtime errors gracefully.

**Files:**
- `components/ErrorBoundary.tsx`

**Key Logic:**
- **React Error Boundary:** Implements a React class component as an error boundary.
- **Error Catching:** `getDerivedStateFromError` and `componentDidCatch` lifecycle methods are used to catch errors and update state.
- **Fallback UI:** Renders a simple "Something went wrong." message when an error is caught.
- **Error Logging:** Logs uncaught errors to the console using `console.error`.
- **Component Wrapping:** Wraps application components within `ErrorBoundary` in `app/layout.tsx` to catch errors at the root level.

---

This document provides a high-level overview of the implementation details for each section of the Zero Next.js web application. It should be useful for AI models to quickly grasp the key components, functionalities, and data flow within the project.