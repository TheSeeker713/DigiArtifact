// Centralized environment config for API base URL
// 1. Prioritize NEXT_PUBLIC_API_URL for production
// 2. Fallback to live worker for quick testing
// 3. Fallback to localhost for development

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://digiartifact-workers-api.digitalartifact11.workers.dev';

// Helper to ensure we always target the /api endpoint cleanly
export const getApiUrl = (endpoint: string) => {
  const base = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash if present
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}/api${path}`;
};
