import React from 'react';

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Placeholder for the Alert (shown for new profiles) */}
      <div className="h-16 w-full bg-muted rounded-lg animate-pulse" />

      {/* Form Card */}
      <div className="glass p-4 rounded-lg shadow-md">
        <div className="space-y-4">
          {/* Name Field */}
          <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded-xl animate-pulse" />
          {/* Email Field (disabled) */}
          <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded-xl animate-pulse" />
          {/* Unit Preference Field */}
          <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
          <div className="h-10 w-1/2 bg-muted rounded-xl animate-pulse" />
          {/* Save Button */}
          <div className="h-10 w-24 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}