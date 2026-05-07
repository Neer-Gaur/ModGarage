import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // long timeout to handle Render free-tier cold starts (~30s)
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Visible request errors in console
api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err?.response) {
      // eslint-disable-next-line no-console
      console.warn(
        `[API] ${err.config?.method?.toUpperCase()} ${err.config?.url} → ${err.response.status}`,
        err.response.data,
      );
    } else if (err?.request) {
      // eslint-disable-next-line no-console
      console.warn(`[API] Network error / CORS / backend down:`, err.message);
    }
    return Promise.reject(err);
  },
);

/**
 * Retry an async function on transient failures (5xx / network).
 * Useful for Render cold-start.
 */
export async function withRetry(fn, { tries = 3, delayMs = 1500 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const status = e?.response?.status;
      // Don't retry on 4xx (except 408/429)
      if (status && status < 500 && status !== 408 && status !== 429) throw e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

export default api;
