# ZeroNow Product Requirements Document [PRD]

## Overview

- **Product Name**: ZeroNow
- **Objective**: Deliver a simple, intuitive fitness tracking web app with a native iOS-like experience, targeting casual gym-goers and beginners.
- **Unique Selling Proposition (USP)**: "The simplest workout tracker with Fitbod-inspired design and flexibility."
- **Target Audience**: Casual gym-goers and fitness novices seeking an easy, affordable fitness tracking solution.

## Key Features

- **Authentication**:
  - Email/password signup and login.
  - Password Reset: Users might forget their passwords.
  - Email Verification: Ensure users sign up with real emails.
  - Google OAuth login.
- **User Profile**:
  - Collected during signup: name, gender (Male/Female/Other), date of birth (13+), weight, height, body fat percentage, unit preference (Metric: kg/cm or Imperial: lb/ft-in, default Metric).
  - All fields mandatory; editable in Profile/Settings.
- **Pages**:
  - **Login/Signup Page**: Toggle between login/signup, includes Google OAuth.
  - **Home/Workout Logging Page** (default): Multi-select dropdown for exercises (categorized by muscle groups), inputs for multiple sets (reps, weight), buttons ("Add Set," "Add Exercise," "Save Workout").
  - **History Page**: Lists past workouts by date with exercises, sets (reps/weights), timestamps, and swipe-to-delete gestures.
  - **Dashboard Page**: Shows total workouts, total volume, static bar charts (daily: last 7 days, weekly: last 4 weeks, monthly: last 6 months).
  - **Profile/Settings Page**: Edit profile details, toggle units (kg/lb, cm/ft-in), switch themes (light/dark, Fitbod-inspired dark), logout.
- **Functionality**:
  - Supports multiple workouts/day, each with multiple exercises and sets (reps, weights).
  - Exercises fetched from a dynamic Supabase list with primary/secondary muscle groups (Fitbod-inspired).
  - Weights displayed in user’s preferred unit (kg or lb); height in cm or ft/in.
  - Theme resets to light mode per device (no cross-device persistence).
  - Future-ready for AI-driven exercise recommendations (manual input now).

## User Experience Requirements

- **Design**: iOS-like aesthetic with rounded corners, minimal layout, smooth scrolling, sliding gestures, responsive animations.
- **Navigation**: Bottom bar with Home, History, Dashboard; top-right settings icon for Profile/Settings.
- **Feedback**: Error messages (e.g., "Weight must be positive") for invalid inputs.

## User Flow

### Overview

Describes the user journey in ZeroNow, ensuring a seamless iOS-like experience with smooth navigation and gestures.

### Flow Steps

1. **Landing on App**:

   - If unauthenticated, redirect to Login/Signup.
   - If authenticated, redirect to Home/Workout Logging.

2. **Login/Signup**:

   - User enters email/password or clicks Google OAuth.
   - On signup, fills name, gender, DOB (13+), weight, height, body fat %, unit preference (default metric).
   - Validates with error messages (e.g., "Invalid email"); redirects to Home on success.

3. **Home/Workout Logging**:

   - User selects exercises (multi-select dropdown, grouped by muscle groups from `Available_Exercises`).
   - Adds sets (reps, weight in user’s unit), uses "Add Set" or "Add Exercise."
   - Saves workout; updates dashboard stats instantly (server-side).

4. **History**:

   - Views paginated list of workouts (20/page) by date.
   - Swipes left to delete workouts (react-swipeable with framer-motion animation).
   - Scrolls smoothly with iOS bounce effect; sees exercises, sets, timestamps in user’s unit.

5. **Dashboard**:

   - Instant load of total workouts, volume, and charts (7 days, 4 weeks, 6 months volume in user’s unit).
   - Static bar charts (Chart.js) display volume trends.

6. **Profile/Settings**:
   - Edits profile details (name, gender, DOB, weight, height, body fat %), toggles units (kg/lb, cm/ft-in), switches theme (light/dark, Fitbod-inspired dark: #1C2526).
   - Logs out; updates apply in real-time.

## Notes for AI

- Use this to generate user-facing requirements and UX flow; avoid technical details (handled in other docs).
- Focus on simplicity and Fitbod-inspired dark mode (#1C2526, #3B82F6).
- Implement navigation with Next.js routing, React Context API for state.
- Use react-swipeable for History swipe gestures; ensure iOS-like transitions with framer-motion.
- Validate user flow with Zod and Supabase Auth.
- Optimize for one-day timeline, prioritizing core flows (authentication, logging, dashboard).
