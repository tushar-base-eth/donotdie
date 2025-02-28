# Implementation Plan

Below is a detailed, step-by-step plan to update the "dontdie" web application based on the specified requirements: enhancing navigation by using `<Link>` for static routes in the bottom navigation and simplifying the signup flow to require only name, email, and password, with default values for other fields and redirection to the home page after signup. The plan is designed to be executed sequentially by a code generation AI, with each step being atomic, manageable, and limited to modifying a small number of files. The steps build logically upon one another, ensuring dependencies are addressed appropriately.

---

## Navigation Enhancement

- [X] Step 1: Update Bottom Navigation to Use `<Link>`
  - **Task**: Replace `useRouter` with Next.js `<Link>` components in the bottom navigation for static routes (e.g., home, dashboard, history, settings) to improve performance and SEO. Reserve `useRouter` for dynamic redirects if needed in the future. Ensure navigation remains smooth and consistent across the app.
  - **Files**:
    - `components/navigation/bottom-nav.tsx`: Replace `useRouter` navigation logic with `<Link>` components for static routes (`/`, `/dashboard`, `/history`, `/settings`). Update any imported `useRouter` references accordingly.
    - `app/layout.tsx`: Import `Link` from `next/link` if not already present, ensuring it’s available globally.
  - **Step Dependencies**: None
  - **User Instructions**: None

---

## Signup Flow Simplification

- [ ] Step 2: Modify Signup Form UI
  - **Task**: Update the signup form on the auth page to only display fields for name, email, and password when in signup mode. Remove any additional fields from the UI to simplify the user experience, as other fields will be handled with default values on the backend.
  - **Files**:
    - `app/auth/page.tsx`: Modify the form to conditionally render only name, email, and password fields when `!isLogin` is true. Ensure the form’s schema (`signupSchema`) reflects this by making other fields optional or removing them from the UI.
  - **Step Dependencies**: None
  - **User Instructions**: None

- [ ] Step 3: Update Signup Function with Default Values
  - **Task**: Adjust the `signup` function in the auth context to insert a user profile into the `users` table with only name, email, and password provided by the user, filling other fields with default values as per the database schema (e.g., `gender: 'Other'`, `date_of_birth: '2000-01-01'`, `weight_kg: 70`, `height_cm: 170`, `unit_preference: 'metric'`). Ensure the function aligns with the schema constraints.
  - **Files**:
    - `contexts/auth-context.tsx`: Update the `signup` function to insert a user profile with default values for fields not collected in the form. Ensure the Supabase `insert` call includes all required fields with appropriate defaults.
  - **Step Dependencies**: Step 2
  - **User Instructions**: None

- [ ] Step 4: Redirect to Home Page After Signup
  - **Task**: Modify the signup logic to redirect the user to the default home page (`/`) after successful signup, instead of the current behavior of redirecting to `/settings`. Update the auth page’s `onSubmit` handler to reflect this change.
  - **Files**:
    - `app/auth/page.tsx`: Update the `onSubmit` function to call `router.push('/')` after a successful signup, removing any conditional redirects to `/settings`.
    - `contexts/auth-context.tsx`: Adjust the `signup` function to redirect to `/` instead of `/settings` after profile creation.
  - **Step Dependencies**: Step 3
  - **User Instructions**: None

- [ ] Step 5: Update Profile Completion Logic
  - **Task**: Adjust the `isProfileCompleteCheck` function in the auth context to reflect the simplified signup flow, ensuring it correctly identifies a profile as incomplete until the user updates additional fields in the settings page. This ensures protected routes requiring a complete profile still redirect appropriately.
  - **Files**:
    - `contexts/auth-context.tsx`: Update `isProfileCompleteCheck` to check only name, email, and gender initially (since email is provided and gender defaults to 'Other'), marking the profile as incomplete until other required fields are filled.
  - **Step Dependencies**: Step 3
  - **User Instructions**: None

---

## Validation and Testing

- [ ] Step 6: Validate Navigation Changes
  - **Task**: Add basic client-side validation to ensure the updated bottom navigation works as expected. Manually test navigation to static routes (`/`, `/dashboard`, `/history`, `/settings`) to confirm smoothness and consistency.
  - **Files**:
    - `components/navigation/bottom-nav.tsx`: Add console logs or temporary assertions to verify `<Link>` navigation triggers correctly.
  - **Step Dependencies**: Step 1
  - **User Instructions**: After implementation, manually test navigation by clicking each bottom nav link in the app to ensure it directs to the correct page without full page reloads.

- [ ] Step 7: Validate Signup Flow
  - **Task**: Test the simplified signup flow end-to-end. Ensure the form accepts only name, email, and password, creates a user with default values, and redirects to the home page. Verify the user profile in the Supabase database matches the expected defaults.
  - **Files**:
    - `app/auth/page.tsx`: Add temporary console logs in `onSubmit` to verify form data.
    - `contexts/auth-context.tsx`: Add logs in `signup` to confirm default values and redirection.
  - **Step Dependencies**: Step 4
  - **User Instructions**: After implementation, test the signup process by creating a new user via the UI. Check the Supabase `users` table to confirm the profile includes default values (e.g., `gender: 'Other'`, `weight_kg: 70`). Ensure redirection to `/` occurs.

---

## Summary

This plan addresses the two main requirements for updating the "dontdie" web application:

1. **Navigation Enhancement**: By replacing `useRouter` with `<Link>` in the bottom navigation, we improve performance and SEO for static routes, ensuring a consistent and smooth user experience. This is handled in a single focused step (Step 1), followed by validation (Step 6).

2. **Signup Flow Simplification**: The signup process is streamlined by reducing the form to name, email, and password, populating other fields with schema-compliant defaults, and redirecting to the home page. This is broken into logical steps: updating the UI (Step 2), adjusting the signup logic (Step 3), handling redirection (Step 4), and refining profile completion logic (Step 5), with end-to-end validation (Step 7).

### Key Considerations:
- **Dependencies**: Steps are sequenced to ensure the UI is updated before backend logic, and redirection is implemented after the signup function is adjusted.
- **File Modifications**: Each step modifies a maximum of 2 files, keeping changes manageable for AI code generation.
- **Schema Alignment**: Default values in Step 3 adhere to the provided Supabase schema (e.g., `gender` constrained to 'Male', 'Female', 'Other').
- **Testing**: Validation steps ensure the changes work as intended without introducing regressions.

This plan provides a clear roadmap for the AI code generation system to implement the updates systematically, ensuring the application remains functional and meets the specified requirements.