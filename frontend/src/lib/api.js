import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("ms_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const setAuthToken = (token) => {
    if (token) localStorage.setItem("ms_token", token);
    else localStorage.removeItem("ms_token");
};

export default api;
