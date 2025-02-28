# Authentication Implementation

## Overview

The DoNotDie web application implements a streamlined authentication system using Supabase Auth and a custom React Context. The system is designed to be user-friendly while maintaining security and providing a smooth user experience.

## Key Design Decisions

1. **Simplified Signup Flow**
   - Only require essential information (email, password, name) during signup
   - Set sensible defaults for optional profile fields
   - Allow immediate access to all features after signup
   - Profile completion is optional and can be done later

2. **State Management**
   - Use React Context for global auth state
   - Three possible auth states: 'loading', 'authenticated', 'unauthenticated'
   - Persist user session using Supabase's session management
   - Automatic session recovery on page reload

3. **Route Protection**
   - All routes are protected by default
   - Unauthenticated users are redirected to /auth
   - Loading states are handled gracefully
   - No mandatory profile completion requirements

## Implementation Details

### Auth Context (`contexts/auth-context.tsx`)

The auth context provides:
- Global authentication state
- User profile management
- Authentication methods (login, signup, logout)
- Profile update functionality

```typescript
interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: UserProfile | null;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (user: Partial<UserProfile>) => Promise<void>;
}
```

### Protected Route Component (`components/auth/protected-route.tsx`)

A higher-order component that:
- Protects routes from unauthorized access
- Handles loading states
- Manages redirections

```typescript
<ProtectedRoute>
  <MyProtectedComponent />
</ProtectedRoute>
```

### Auth Flow

1. **Initial Load**
   ```
   App Load → Check Session → Show Loading → Fetch Profile → Render Protected Content
   ```

2. **Signup Process**
   ```
   Enter Details → Create Auth Account → Create Profile with Defaults → Redirect to Home
   ```

3. **Login Process**
   ```
   Enter Credentials → Verify → Fetch Profile → Redirect to Home
   ```

4. **Session Management**
   ```
   Page Load → Check Local Storage → Validate Session → Update Context
   ```

### Default Profile Values

When a new user signs up, the following defaults are set:

```typescript
{
  gender: 'Other',
  date_of_birth: '2000-01-01',
  weight_kg: 70,
  height_cm: 170,
  unit_preference: 'metric',
  theme_preference: 'light'
}
```

## Security Considerations

1. **Password Requirements**
   - Minimum 6 characters
   - Handled by Supabase Auth

2. **Session Management**
   - Secure session tokens
   - Automatic token refresh
   - Secure storage in browser

3. **Route Protection**
   - All routes protected by default
   - No client-side-only authentication
   - Server-side session validation

## Error Handling

The system handles various error scenarios:
- Invalid credentials
- Network issues
- Profile creation failures
- Session expiration

## Future Improvements

1. **Social Authentication**
   - Add support for Google, Apple, etc.
   - Maintain profile consistency across providers

2. **Enhanced Security**
   - Add 2FA support
   - Implement password complexity requirements
   - Add email verification

3. **Profile Management**
   - Bulk profile updates
   - Profile data export
   - Account deletion

## Testing Considerations

Key areas to test:
- Authentication flows
- Session persistence
- Error handling
- Route protection
- Profile updates

## Dependencies

- Supabase Auth
- Next.js
- React Context API
- TypeScript for type safety 