const IS_SERVER = typeof window === 'undefined';
let baseURL = '';

if (IS_SERVER) {
  baseURL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
} else {
  // On the client use the relative path
  baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
}

export const API_ENDPOINTS = {
  fixedValues: `${baseURL}/api/fixed-values`,
  rangeConfig: `${baseURL}/api/range-config`
};
