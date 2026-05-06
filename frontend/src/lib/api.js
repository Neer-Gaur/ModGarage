import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Single axios instance that auto-attaches the Supabase JWT
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;
