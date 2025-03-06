Below is a detailed implementation plan to integrate Google OAuth login using Supabase into your existing application, while ensuring compatibility with the current `auth-context` setup and addressing how the settings page will handle updates to `name` and `unit_preference`. This plan outlines actionable steps, specific code changes, and architectural considerations.

---

## Implementation Plan

### Overview
To add Google OAuth login with Supabase:
- Configure Google OAuth in the Supabase dashboard.
- Extend the `AuthContext` to support OAuth sign-in.
- Update the login page to include a Google sign-in option.
- Ensure the callback page handles OAuth redirects.
- Adjust profile fetching to leverage Google-provided data (e.g., name).
- Verify that the settings page continues to handle `name` and `unit_preference` updates seamlessly.

This approach maintains the integrity of the existing `auth-context` by adding new functionality without altering current methods.

---

### Step 1: Configure Google OAuth in Supabase
**Location**: Supabase Dashboard (External Configuration)  
**Details**:  
- **Action**: Set up Google OAuth in the Supabase dashboard under Authentication > Providers.
  - Create an OAuth app in the Google Cloud Console to obtain a Client ID and Client Secret.
  - Enter these credentials in Supabase under the Google provider settings.
  - Set the redirect URL to `http://localhost:3000/auth/callback` (for development) or your production URL (e.g., `https://yourdomain.com/auth/callback`).
- **Reasoning**: This enables Supabase to initiate the OAuth flow and redirect users back to your app after authentication.
- **Impact**: No code changes required here, but the redirect URL must match the callback page in your app.

---

### Step 2: Update AuthContext for Google OAuth
**File**: `contexts/auth-context.tsx`  
**Changes**: Add a `signInWithGoogle` method to support OAuth login.

#### 2.1 Update `AuthContextType` Interface
**Location**: Line 34-43 (interface definition)  
**Change**: Add `signInWithGoogle` to the `AuthContextType` interface.  
**Code**:
```typescript
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, unitPreference: "metric" | "imperial") => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UpdatableProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>; // New method
}
```
**Reasoning**: This ensures the new method is part of the context API, making it accessible via the `useAuth` hook.  
**Impact**: No disruption to existing methods; purely additive.

#### 2.2 Implement `signInWithGoogle` Function
**Location**: Inside `AuthProvider` function, after `refreshProfile` definition (around line 174)  
**Change**: Add the `signInWithGoogle` function.  
**Code**:
```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
};
```
**Parameters**: None  
**Return Type**: `Promise<void>`  
**Logic**: 
- Uses Supabase’s `signInWithOAuth` to initiate the Google OAuth flow.
- Specifies the redirect URL to ensure proper callback handling.
- Throws an error if the sign-in fails (e.g., network issues or user cancellation), which can be caught by the caller.  
**Dependencies**: Relies on `supabase` from `lib/supabaseClient.ts` (already imported).  
**Impact**: The auth state listener (lines 105-117) will automatically fetch the user profile upon successful sign-in, so no additional profile fetching is needed here.

#### 2.3 Update Context Provider Value
**Location**: Line 177 (inside `AuthContext.Provider`)  
**Change**: Include `signInWithGoogle` in the value object.  
**Code**:
```typescript
<AuthContext.Provider value={{ state, login, signup, logout, updateProfile, refreshProfile, signInWithGoogle }}>
```
**Reasoning**: Exposes the new method to components using the `useAuth` hook.

#### 2.4 Enhance `fetchUserProfile` for Google Data
**Location**: Lines 50-96 (existing `fetchUserProfile` function)  
**Change**: Use `user_metadata` to set the name from Google if available.  
**Code**:
```typescript
const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email || "";
  const userMetadata = userData.user?.user_metadata || {};

  let { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    const name = userMetadata.name || "New User"; // Use Google-provided name if available
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        name,
        gender: "Other",
        date_of_birth: "2000-01-01",
        weight_kg: 70,
        height_cm: 170,
        body_fat_percentage: null,
        unit_preference: "metric", // Default value
        theme_preference: "light",
        total_volume: 0,
        total_workouts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (insertError) throw new Error("Failed to create profile");
    profile = newProfile;
  }

  return {
    id: userId,
    email,
    name: profile.name,
    gender: profile.gender as "Male" | "Female" | "Other" | null,
    dateOfBirth: profile.date_of_birth,
    weight: profile.weight_kg,
    height: profile.height_cm,
    bodyFat: profile.body_fat_percentage,
    unitPreference: profile.unit_preference as "metric" | "imperial",
    themePreference: profile.theme_preference as "light" | "dark" | null,
    totalVolume: profile.total_volume,
    totalWorkouts: profile.total_workouts,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
};
```
**Logic**: 
- Retrieves `user_metadata` from the Supabase auth user object.
- Uses `userMetadata.name` (provided by Google) as the profile name if available, falling back to "New User".
- Keeps `unit_preference` as "metric" by default, as Google doesn’t provide this data.  
**Reasoning**: Enhances profile creation for Google users without altering the existing logic for email/password users.  
**Impact**: Ensures consistency in profile creation across authentication methods.

---

### Step 3: Modify the Login Page
**File**: `app/auth/page.tsx`  
**Changes**: Add a "Sign in with Google" button.

#### 3.1 Import `signInWithGoogle` from `useAuth`
**Location**: Line 17 (existing imports)  
**Change**: Update the `useAuth` destructuring.  
**Code**:
```typescript
import { useAuth } from "@/contexts/auth-context";

const { state, login, signup, signInWithGoogle } = useAuth();
```
**Reasoning**: Makes the new method available in the component.

#### 3.2 Add Google Sign-In Button
**Location**: Inside the form, after the toggle button (around line 300)  
**Change**: Add a button to trigger Google OAuth.  
**Code**:
```typescript
<Button
  variant="outline"
  className="w-full"
  onClick={async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setMessage({ text: error.message || "Failed to sign in with Google", isError: true });
    } finally {
      setIsLoading(false);
    }
  }}
  disabled={isLoading}
  type="button"
  aria-label="Sign in with Google"
>
  Sign in with Google
</Button>
```
**Logic**: 
- Calls `signInWithGoogle` on click.
- Sets a loading state to prevent multiple clicks.
- Displays an error message if the sign-in fails (e.g., user cancels the OAuth flow).  
**Reasoning**: Provides a seamless alternative to email/password login without altering the existing form structure.  
**Impact**: Minimal, as it’s a new UI element; existing login/signup flows remain intact.

---

### Step 4: Enhance Callback Page Handling
**File**: `app/auth/callback/page.tsx`  
**Changes**: Add logic to redirect users after OAuth authentication.

#### 4.1 Import Dependencies
**Location**: Top of the file  
**Change**: Add imports for `useAuth`, `useRouter`, and `useEffect`.  
**Code**:
```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
```
**Reasoning**: Enables client-side redirect logic.

#### 4.2 Add Redirect Logic
**Location**: Replace the existing function body  
**Change**: Check the session and redirect to `/home`.  
**Code**:
```typescript
export default function Callback() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "authenticated") {
      router.push("/home");
    }
  }, [state.status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>Verifying your authentication... Please wait.</p>
        <div className="mt-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
```
**Logic**: 
- Uses `useEffect` to monitor the auth state.
- Redirects to `/home` once authenticated.
- Displays a loading message during the process.  
**Reasoning**: Improves UX by automatically redirecting users after OAuth, leveraging the existing auth state listener in `auth-context`.  
**Impact**: Replaces the static message with dynamic behavior; no effect on email confirmation callbacks.

---

### Step 5: Settings Page Handling
**File**: `app/settings/page.tsx`  
**Analysis**: No code changes required.  
**Reasoning**: 
- The settings page uses `useAuth` to access `user` data and `updateProfile` to save changes (lines 65-67, 107-122).
- `name` and `unit_preference` are fetched from the `profiles` table via `fetchUserProfile` (updated in Step 2.4 to use Google’s `user_metadata.name`).
- Updates via `updateProfile` (in `auth-context.tsx`, lines 148-169) write to the `profiles` table, regardless of the sign-in method.
- Email is read-only (lines 216-222), so Google-managed emails are unaffected.  
**Impact**: Google OAuth users can update `name` and `unit_preference` seamlessly, as the existing logic is provider-agnostic.

---

### Architectural Decisions
1. **Separation of Concerns**: Added `signInWithGoogle` as a distinct method in `AuthContext` to keep OAuth logic separate from email/password flows, enhancing maintainability.
2. **Profile Data Source**: Chose to use `user_metadata.name` from Google for new profiles, falling back to "New User", to leverage OAuth data without overcomplicating the schema.
3. **Callback Handling**: Opted for client-side redirect in `callback/page.tsx` using `useAuth`, aligning with the app’s client-side auth management approach.
4. **Minimal Disruption**: Ensured existing `login`, `signup`, and `updateProfile` methods remain unchanged to preserve the current `auth-context` behavior.

---

### Potential Side Effects
- **Error Handling**: OAuth errors (e.g., user cancellation) are surfaced in the login page but could be enhanced with a loading indicator for better UX.
- **Account Linking**: Supabase’s default setting links accounts with matching emails across providers, which is desirable here but should be verified in testing.
- **Profile Defaults**: `unit_preference` defaults to "metric" for Google users; consider if this should be configurable via a prompt in the future.

---

### Summary of Changes
| **File**                  | **Change**                                      | **Location**         |
|---------------------------|-------------------------------------------------|----------------------|
| `contexts/auth-context.tsx` | Add `signInWithGoogle` to interface and impl. | Lines 34, ~174      |
| `contexts/auth-context.tsx` | Update `fetchUserProfile` for `user_metadata` | Lines 50-96         |
| `app/auth/page.tsx`       | Add Google sign-in button                    | ~Line 300           |
| `app/auth/callback/page.tsx` | Add redirect logic                        | Entire file         |
| Supabase Dashboard        | Configure Google OAuth                       | External            |

This plan integrates Google OAuth login without breaking the existing `auth-context`, while ensuring the settings page handles `name` and `unit_preference` updates consistently for all users.