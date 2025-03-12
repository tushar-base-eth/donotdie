// Attempt to import user-specific configuration
let userConfig;
try {
  const mod = await import('./v0-user-next.config');
  userConfig = mod.default;
} catch (e) {
  // Ignore if user config is not found or fails to load
}

/** @type {import('next').NextConfig} */
const baseConfig = {
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

// Development-specific configuration
const devConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

// Production-specific configuration
const prodConfig = {
  reactStrictMode: true, // Default in Next.js, kept for clarity
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false, // Default, kept for clarity
  },
};

// Select environment-specific config based on NODE_ENV
const envConfig = process.env.NODE_ENV === 'development' ? devConfig : prodConfig;

// Merge base and environment-specific configurations
const nextConfig = { ...baseConfig, ...envConfig };

// Merge with user-specific configuration if it exists
if (userConfig) {
  mergeConfig(nextConfig, userConfig);
}

// Function to merge configurations, handling nested objects
function mergeConfig(target, source) {
  if (!source) return;
  for (const key in source) {
    if (
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key]) &&
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      target[key] = { ...target[key], ...source[key] };
    } else {
      target[key] = source[key];
    }
  }
}

export default nextConfig;