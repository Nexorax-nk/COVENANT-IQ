// frontend/lib/config.ts

const isProduction = process.env.NODE_ENV === 'production';

// We will update this string AFTER we deploy the backend
export const API_BASE_URL = isProduction 
  ? process.env.NEXT_PUBLIC_API_URL 
  : "http://localhost:8000";