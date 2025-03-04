import React from 'react';

export function MetricsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-4 rounded-lg shadow-md h-24 bg-muted animate-pulse" />
        <div className="glass p-4 rounded-lg shadow-md h-24 bg-muted animate-pulse" />
      </div>
      {/* Volume Chart */}
      <div className="glass p-4 rounded-lg shadow-md h-64 bg-muted animate-pulse" />
    </div>
  );
}