import React from 'react';

export function WorkoutListSkeleton() {
  return (
    <div className="space-y-4">
      {Array(3).fill(0).map((_, index) => (
        <div key={index} className="glass p-4 rounded-lg shadow-md bg-muted animate-pulse">
          {/* Placeholder for workout date */}
          <div className="h-4 w-1/3 bg-muted rounded" />
          {/* Placeholder for workout time */}
          <div className="h-3 w-1/4 bg-muted rounded mt-2" />
          {/* Placeholder for workout volume */}
          <div className="h-3 w-1/5 bg-muted rounded mt-2" />
        </div>
      ))}
    </div>
  );
}